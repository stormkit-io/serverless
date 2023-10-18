export const decodeString = (body?: string): string => {
  return Buffer.from(body || "", "base64").toString("utf-8");
};
