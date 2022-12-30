/**
 * THIS FILE IS UNDER DEVELOPMENT - DO NOT USE IT IN PRODUCTION.
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";

for (const file of ["stormkit.env", ".env"]) {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    dotenv.config({ path: file });
    break;
  }
}

interface Configuration {
  envId?: string;
  apiKey?: string;
  baseUrl?: string;
}

const conf: Configuration = {
  apiKey: process.env.SK_API_KEY,
  baseUrl: process.env.SK_DATA_STORE_URL || "https://api.stormkit.io",
};

const INVALID_API_KEY =
  "Stormkit DataStore requires an environment-level API key. You can generate that from your Environment page.";

const API_KEY_MISSING =
  "Stormkit missing API key. Go to your application > settings to generate a new key.";

type Primitive = string | number | boolean;

type Filter = {
  "="?: Primitive;
  ">"?: number;
  "<"?: number;
  ">="?: number;
  "<="?: number;
  "!="?: Primitive;
  in?: string[] | number[];
};

type Operator = keyof Filter;

interface StoreResponse {
  recordIds?: string[];
  error?: string;
}

interface MakeRequestProps {
  url: string;
  method?: string;
  body: Record<string, any>;
}

interface APIFilter {
  prop: string;
  op: Operator;
  val: Primitive | string[] | number[];
}

interface FetchOptions {
  limit: number;
}

const makeRequest = <T>({
  url,
  body,
  method = "POST",
}: MakeRequestProps): Promise<T> => {
  if (!conf.apiKey) {
    return Promise.reject(API_KEY_MISSING);
  }

  if (!conf.apiKey.startsWith("env")) {
    return Promise.reject(INVALID_API_KEY);
  }

  const parsed = new URL(path.join(conf.baseUrl!, url));

  const opts: http.RequestOptions = {
    host: parsed.hostname,
    port: parsed.port,
    protocol: parsed.protocol,
    path: url,
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${conf.apiKey}`,
    },
  };

  const httpAgent = opts.protocol?.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    const request = httpAgent.request(opts, (res) => {
      res.setEncoding("utf8");

      const data: string[] = [];

      res.on("data", (chunk) => {
        data.push(chunk);
      });

      res.on("end", () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          return reject(`Response returned ${res.statusCode}: ${data}`);
        }

        try {
          resolve(JSON.parse(data.join("")) as T);
        } catch {
          reject(res);
        }
      });
    });

    request.write(JSON.stringify(body));
    request.end();
  });
};

/**
 * { category: "real_estate", price: { ">": 12, "<": 20 }}
 *
 * becomes
 *
 * [
 *  { prop: "category", op: "=", val: "real_estate" },
 *  { prop: "price", "op": ">", "val": 12 },
 *  { prop: "price", "op": "<", "val": 20 }
 * ]
 */
const mapFilters = (
  filters?: Record<string, Filter | Primitive>
): APIFilter[] => {
  if (!filters) {
    return [];
  }

  const apiFilters: APIFilter[] = [];

  Object.keys(filters).forEach((prop) => {
    if (typeof filters[prop] === "object") {
      const filter = filters[prop] as Filter;

      Object.keys(filter).forEach((op) => {
        apiFilters.push({
          prop,
          op: op as Operator,
          val: filter[op as Operator] as Primitive,
        });
      });

      return;
    }

    apiFilters.push({ prop, op: "=", val: filters[prop] as Primitive });
  });

  return apiFilters;
};

const storage = {
  async store(
    collectionName: string,
    recordValue: Record<string, any> | Record<string, any>[]
  ): Promise<StoreResponse> {
    const items: {
      recordValue: Record<string, any>;
      collectionName: string;
    }[] = [];

    if (!Array.isArray(recordValue)) {
      items.push({ recordValue, collectionName });
    } else {
      recordValue.forEach((kv) => {
        items.push({ collectionName, recordValue: kv });
      });
    }

    const response = await makeRequest<StoreResponse>({
      url: "/app/data-storage",
      body: {
        items,
      },
    });

    // Save record id
    if (response.recordIds) {
      response.recordIds.forEach((recordId, index) => {
        items[index].recordValue.recordId = recordId;
      });
    }

    return response;
  },

  async fetch<T>(
    collectionName: string,
    filters?: Record<string, Filter | Primitive>,
    options?: FetchOptions
  ): Promise<(T & { recordId: string })[]> {
    return await makeRequest<(T & { recordId: string })[]>({
      url: "/app/data-storage/query",
      body: {
        collectionName,
        filters: mapFilters(filters),
        limit: options?.limit,
      },
    });
  },

  async fetchOne<T>(
    collectionName: string,
    filters?: Record<string, Filter | Primitive>
  ): Promise<T & { recordId: string }> {
    return (await storage.fetch<T>(collectionName, filters, { limit: 1 }))[0];
  },

  async removeByCollectionName(
    collectionName: string
  ): Promise<{ ok: boolean }> {
    return await makeRequest<{ ok: boolean }>({
      url: "/app/data-storage",
      method: "DELETE",
      body: {
        collectionName,
      },
    });
  },

  async removeByRecordId(
    recordIds: string[] | string
  ): Promise<{ ok: boolean }> {
    return await makeRequest<{ ok: boolean }>({
      url: "/app/data-storage",
      method: "DELETE",
      body: {
        recordIds: Array.isArray(recordIds) ? recordIds : [recordIds],
      },
    });
  },
};

export default storage;
