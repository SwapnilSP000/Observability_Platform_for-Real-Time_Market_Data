import subprocess
import sys

def run_verify():
    print("Running verify_backend.py...")
    res = subprocess.run([sys.executable, "verify_backend.py"], capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)

if __name__ == "__main__":
    run_verify()
