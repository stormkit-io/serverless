/**
 * THIS FILE IS UNDER DEVELOPMENT - DO NOT USE IT IN PRODUCTION.
 */
import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

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

const makeRequest = async <T>({
  url,
  body,
  method = "POST",
}: MakeRequestProps): Promise<T> => {
  if (!conf.apiKey) {
    throw new Error(API_KEY_MISSING);
  }

  if (!conf.apiKey.startsWith("env")) {
    throw new Error(INVALID_API_KEY);
  }

  const res = await axios(url, {
    baseURL: conf.baseUrl,
    method,
    headers: {
      Authorization: `${conf.apiKey}`,
    },
    data: body,
  });

  const data = res.data;

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Response returned ${res.status}: ${data}`);
  }

  return data as T;
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
    keyName: string,
    keyValue: Record<string, any> | Record<string, any>[]
  ): Promise<StoreResponse> {
    const items: { keyValue: Record<string, any>; keyName: string }[] = [];

    if (!Array.isArray(keyValue)) {
      items.push({ keyValue, keyName });
    } else {
      keyValue.forEach((kv) => {
        items.push({ keyName, keyValue: kv });
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
        items[index].keyValue.recordId = recordId;
      });
    }

    return response;
  },

  async fetch<T>(
    keyName: string,
    filters?: Record<string, Filter | Primitive>,
    options?: FetchOptions
  ): Promise<(T & { recordId: string })[]> {
    return await makeRequest<(T & { recordId: string })[]>({
      url: "/app/data-storage/query",
      body: {
        keyName,
        filters: mapFilters(filters),
        limit: options?.limit,
      },
    });
  },

  async fetchOne<T>(
    keyName: string,
    filters?: Record<string, Filter | Primitive>
  ): Promise<T & { recordId: string }> {
    return (await storage.fetch<T>(keyName, filters, { limit: 1 }))[0];
  },

  async removeByKey(keyName: string): Promise<{ ok: boolean }> {
    return await makeRequest<{ ok: boolean }>({
      url: "/app/data-storage",
      method: "DELETE",
      body: {
        keyName,
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
