import fs from "fs";

export const mockMainJs = () => {
  return fs
    .readFileSync(`${__dirname}/mockdata/main_js.txt`)
    .toString("utf-8")
    .replace(/\n/g, "\r\n");
};

export const mockUploadData = () => {
  const headers = {
    "user-agent": "curl/7.64.1",
    accept: "*/*",
    "content-length": "1421",
    "content-type":
      "multipart/form-data; boundary=------------------------893d525885d56cf1",
    expect: "100-continue",
  };

  const body = fs
    .readFileSync(`${__dirname}/mockdata/file_upload.txt`)
    .toString("utf-8")
    .replace(/\n/g, "\r\n");

  return { body, headers };
};
