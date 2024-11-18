import { useEffect, useState } from "react";
import "./App.css";
import { Button, Input, Progress } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import ArowBackIcon from "@rsuite/icons/ArowBack";

const categories = [
  "dataCollected",
  "dataSharing",
  "dataSold",
  "optOutOptions",
  "dataSecurity",
  "dataDeletion",
  "policyClarity",
  "purpose",
];

const labels: Record<string, string> = {
  dataCollected: "Data Collection",
  dataSharing: "Data Sharing",
  dataSold: "Data Sold",
  optOutOptions: "Opt-Out Options",
  dataSecurity: "Data Security",
  dataDeletion: "Data Deletion",
  policyClarity: "Policy Clarity",
  purpose: "Purpose of data collection",
};

const generatePrompt = (url: string) => {
  return `
  Detect if this page is a privacy policy page: ${url}. If there is no privacy policy on the page just say: "No privacy policy detected.",
  do not try to summerize anything else.
  If it is a privacy policy page, analyze the following competencies and give a score (as a number between 1-10) to each category the policy mentioned:
  "dataCollected: Determines what types of data the platform gathers and how comprehensive the list is.
  purpose: Evaluates how the collected data is used, ensuring purposes are legitimate and reasonable.
  dataSharing: Checks if user data is shared, under what conditions, and with whom.
  dataSold: Assesses if personal data is sold, a critical point for user privacy.
  optOutOptions: Reviews the availability and simplicity of mechanisms for users to opt out of data sharing or collection.
  dataSecurity: Investigates the methods used to secure data, such as encryption and audits.
  dataDeletion: Looks at whether users can delete their data and how straightforward the process is.
  policyClarity: Measures how understandable and accessible the policy language is to a general audience."
  
  Return json. Only return the json, don't say anything like "Here is the output". With the score value 
  {scores:{dataCollected, dataSharing, dataSold, optOutOptions, dataSecurity, dataDeletion, policyClarity}, description}
  Description attribute is a reasoning of the score for each category. Explain what they do well and what 
  they do poorly for each category. Description should be an object that has each category as a key and value as an explanation of the score given
  It is very important to return valid json following this, only return valid json.
  `;
};

interface IResponse {
  scores: Record<string, number>;
  description: string;
}
function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [state, setState] = useState<"error" | "found" | "not found" | "">("");
  const [response, setResponse] = useState<IResponse>();
  const [link, setLink] = useState("");
  const [total, setTotal] = useState<number>();

  const scanPrivacyPolicy = async (url: string) => {
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VITE_API_KEY}`,
    };

    const body = JSON.stringify({
      model: "llama3-8b-8192",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: generatePrompt(url),
        },
      ],
    });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: body,
      });

      const data = await response.json();
      setState("found");
      console.log(JSON.parse(data.choices[0].message.content));
      const json = JSON.parse(data.choices[0].message.content);
      setResponse(json);
      const total = parseFloat(
        (
          (categories.reduce((sum, c) => sum + json.scores[c], 0) /
            categories.length) *
          10
        ).toPrecision(3)
      );
      setTotal(total);
    } catch (error) {
      setState("error");
    }
  };

  const findPrivacyPolicy = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabUrl = tab?.url as string;

    if (activeTabUrl && tab.id) {
      let found = false;
      let relevantTexts: HTMLElement[] = [];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [activeTabUrl],
        func: (activeTabUrl) => {
          const privacyKeywords = [
            "privacy policy",
            "data policy",
            "data protection policy",
            "privacy statement",
            "policy agreement",
            "privacy agreement",
            "data privacy",
            "data protection",
            "personal information",
          ];

          relevantTexts = Array.from(
            document.querySelectorAll("a, h1, h2, span")
          ) as HTMLElement[];

          found = relevantTexts.some((t) =>
            privacyKeywords.some((keyword) =>
              t.innerText?.toLowerCase().includes(keyword)
            )
          );
          chrome.runtime.sendMessage({ found, activeTabUrl });
        },
      });
    }
  };

  const scanPage = () => {
    setIsScanning(true);
    findPrivacyPolicy();
  };

  const submitLink = () => {
    scanPrivacyPolicy(link);
    setIsScanning(true);
  };

  const reset = () => {
    setState("");
    setResponse(undefined);
    setIsScanning(false);
    setLink("");
  };

  const onChangeHandler = (v: string) => {
    setLink(v);
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.found) {
        setState("found");
        scanPrivacyPolicy(message.activeTabUrl);
      } else {
        setState("not found");
      }
    });
  }, []);

  return (
    <div className="extension">
      {state === "found" && response && total ? (
        <div>
          <p className="goBack" onClick={reset}>
            <ArowBackIcon /> Go back
          </p>
          {categories.map((c) => {
            const val = response.scores[c] * 10;
            const color =
              val > 70 ? "#4caf50" : val > 40 ? "#ffc107" : "#f44336";
            return (
              <div>
                {labels[c as string]}
                <Progress.Line key={c} percent={val} strokeColor={color} />
                {response.description[c as any]}
                <hr />
              </div>
            );
          })}
          <div className="circle-container">
            <div className="circle">
              <Progress.Circle
                percent={total}
                strokeColor={
                  total > 70 ? "#4caf50" : total > 40 ? "#ffc107" : "#f44336"
                }
              />
            </div>
          </div>
          <ul className="explanation">
            <p> Definitions</p>
            <li key="exp1">
              <b>Data Collected</b>: Determines what types of data the platform
              gathers and how comprehensive the list is.
            </li>
            <li key="exp3">
              <b>Data Sharing with Third Parties</b>: Checks if user data is
              shared, under what conditions, and with whom.
            </li>
            <li key="exp4">
              <b>Data Sold to Third Parties</b>: Assesses if personal data is
              sold, a critical point for user privacy.
            </li>
            <li key="exp5">
              <b>Opt-Out Options</b>: Reviews the availability and simplicity of
              mechanisms for users to opt out of data sharing or collection.
            </li>
            <li key="exp6">
              <b>Data Security</b>: Investigates the methods used to secure
              data, such as encryption and audits.
            </li>
            <li key="exp7">
              <b>Data Deletion</b>: Looks at whether users can delete their data
              and how straightforward the process is.
            </li>
            <li key="exp8">
              <b>Policy Clarity</b>: Measures how understandable and accessible
              the policy language is to a general audience.
            </li>
            <li key="exp2">
              <b>Purpose of Data Use</b>: Evaluates how the collected data is
              used, ensuring purposes are legitimate and reasonable.
            </li>
          </ul>
        </div>
      ) : state === "not found" ? (
        <p>No privacy policy found on this page.</p>
      ) : (
        <div>
          <div>
            <h1 className="title">Policy Analyzer</h1>
            <p className="desc">
              Let the extension scan the page and analyze the privacy policy if
              there is any.
            </p>
            <div className="card">
              <Button appearance="primary" onClick={scanPage}>
                {isScanning ? "Scanning..." : "Scan Page"}
              </Button>
            </div>
          </div>
          <div className="seperator-container">
            <hr className="seperator" />
            <span>Or</span>
            <hr className="seperator" />
          </div>
          <div className="second-card">
            <p>Provide a link to any privacy policy:</p>
            <div className="card">
              <Input
                className="textarea"
                as="textarea"
                rows={3}
                placeholder="Provide a link to any privacy policy"
                value={link}
                onChange={onChangeHandler}
              />
              <Button
                appearance="primary"
                onClick={submitLink}
                disabled={!link}
              >
                {isScanning ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
