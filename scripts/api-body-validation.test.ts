import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { POST as course } from "../app/api/free-course/signup/route";
import { POST as gate } from "../app/api/gate/route";
import { POST as deepdive } from "../app/api/deepdive/route";
import { POST as reading } from "../app/api/reading/route";
import { POST as compatibility } from "../app/api/compatibility/route";
import { POST as storyarc } from "../app/api/storyarc/route";

for (const [name, handler] of [["gate",gate],["deepdive",deepdive],["storyarc",storyarc],["free-course",course]] as const) {
  test(`${name}: invalid JSON shapes return 400 without throwing`, async () => {
    let index=0;
    for (const body of ["null", "[]", '"text"', "42", '{"email":42,"code":{},"birthdate":42,"date":[],"focus":{}}', "{", "{}"] ) {
      const req = new NextRequest(`https://example.test/api/${name}`, {method:"POST", headers:{"content-type":"application/json", "cf-connecting-ip":`body-test-${name}-${index++}`}, body});
      const response = await handler(req);
      expect(response.status).toBe(400);
      expect(typeof (await response.json()).error).toBe("string");
    }
  });
}

for (const [name, handler] of [["reading",reading],["compatibility",compatibility]] as const) {
  test(`${name}: rejects malformed bodies with CORS preserved`, async () => {
    for (const body of ["null", "[]", '\"text\"', "42", "{"]) {
      const response = await handler(new NextRequest(`https://example.test/api/${name}`, { method: "POST", body }));
      expect(response.status).toBe(400);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(await response.json()).toEqual({error: "invalid JSON body"});
    }
  });
}
for (const [name, handler] of [["deepdive",deepdive],["storyarc",storyarc]] as const) {
  test(`${name}: malformed optional fields cannot bypass authentication or throw`, async () => {
    const response = await handler(new NextRequest(`https://example.test/api/${name}`, {
      method: "POST", body: JSON.stringify({birthdate: "1991-02-17", date: 42, focus: {value:"x"}}),
    }));
    expect(response.status).toBe(402);
    expect((await response.json()).gate).toBe(true);
  });
}
