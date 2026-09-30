import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveCapabilities as subject } from '../../interview-03/_interviewer/reference.mjs';
const examples=[
  {
    "label": "Unknown grant and explicit denials",
    "args": [
      [
        "read",
        "write",
        "admin",
        "root"
      ],
      [
        "write",
        "admin"
      ]
    ],
    "expected": [
      "read"
    ]
  },
  {
    "label": "Case remains significant",
    "args": [
      [
        "READ",
        "read",
        "read"
      ],
      [
        "READ"
      ]
    ],
    "expected": [
      "read"
    ]
  },
  {
    "label": "An empty grant set stays empty",
    "args": [
      [],
      [
        "read"
      ]
    ],
    "expected": []
  }
];
function freeze(value) {
  if(value && typeof value==='object') {
    for(const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
for(const example of examples) {
  test(example.label,()=>{
    const args=structuredClone(example.args);
    const before=structuredClone(args);
    freeze(args);
    assert.deepEqual(subject(...args),example.expected);
    assert.deepEqual(args,before);
  });
}
