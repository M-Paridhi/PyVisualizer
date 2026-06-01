"""Quick smoke-test for the tracer — run with: python test_tracer.py"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from tracer import ExecutionTracer

TEST_CODE = """
a = 5
b = 10
c = a + b

def add(x, y):
    result = x + y
    return result

r = add(a, b)
print(r)

nums = [1, 2, 3]
nums.append(4)

student = {"name": "Alice", "grade": 90}
student["grade"] = 95
"""

if __name__ == "__main__":
    tracer = ExecutionTracer(TEST_CODE.strip())
    result = tracer.run()

    print(f"Success: {result['success']}")
    print(f"Total steps: {result['total_steps']}")
    print()

    for snap in result["snapshots"]:
        print(f"Step {snap['step']} | Line {snap['line']} | Event: {snap['event']}")
        print(f"  Source : {snap['source_line']}")
        if snap["globals"]:
            print(f"  Globals: {json.dumps(snap['globals'], indent=4)}")
        if snap["stack"]:
            print(f"  Stack  : {json.dumps(snap['stack'], indent=4)}")
        if "return_value" in snap:
            print(f"  Return : {snap['return_value']}")
        print()