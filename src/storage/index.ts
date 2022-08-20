/**
 * THIS FILE IS UNDER DEVELOPMENT - DO NOT USE IT IN PRODUCTION.
 */
import fetch from "node-fetch";

const API_KEY_MISSING =
  "Stormkit missing API key. Go to your application > settings to generate a new key.";

const ENDPOINT = process.env.SK_DATA_STORE_URL || "https://api.stormkit.io";

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
  recordId?: string;
  error?: string;
}

interface MakeRequestProps {
  url: string;
  method?: string;
  body: Record<string, any>;
}

const makeRequest = async <T>({
  url,
  body,
  method = "POST",
}: MakeRequestProps): Promise<T> => {
  const conf = global.sk;

  if (!conf.apiKey) {
    throw new Error(API_KEY_MISSING);
  }

  const res = await fetch(`${ENDPOINT}${url}?eid=${conf.envId}`, {
    method,
    headers: {
      Authorization: `${conf.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Response returned ${res.status}: ${await res.text()}`);
  }

  return (await res.json()) as T;
};

interface APIFilter {
  prop: string;
  op: Operator;
  val: Primitive | string[] | number[];
}

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

class Storage {
  async store(
    keyName: string,
    keyValue: Record<string, any>
  ): Promise<StoreResponse> {
    return await makeRequest<StoreResponse>({
      url: "/app/data-storage",
      body: {
        keyName,
        keyValue,
      },
    });
  }

  async fetch<T>(
    keyName: string,
    filters?: Record<string, Filter | Primitive>
  ): Promise<T> {
    return await makeRequest<T>({
      url: "/app/data-storage/query",
      body: {
        keyName,
        filters: mapFilters(filters),
      },
    });
  }

  async remove(recordId: string): Promise<{ ok: boolean }> {
    return await makeRequest<{ ok: boolean }>({
      url: "/app/data-storage",
      method: "DELETE",
      body: {
        recordId,
      },
    });
  }
}

export default new Storage();
