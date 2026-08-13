import os
import sys
import subprocess
import time

def main():
    # Ensure current working directory is the project root
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)

    print("=========================================")
    print("   HR SmartRank AI Server Launcher")
    print("=========================================")
    
    # 1. Start Backend FastAPI Server
    print("Launching FastAPI backend (port 8000)...")
    backend_cmd = [sys.executable, "main.py"]
    
    # On Windows, python execution in shell or direct list works.
    # Share stdout/stderr to console log to prevent piping buffer blocks.
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=os.path.join(root_dir, "backend"),
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    # Wait for backend initialization
    time.sleep(2)

    # 2. Start Frontend React Vite Server
    print("Launching React Vite frontend (port 5173)...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=os.path.join(root_dir, "frontend"),
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    print("\n[SUCCESS] Servers are running! Press Ctrl+C in terminal to stop.")
    
    try:
        # Monitor processes
        while True:
            # Check for crash
            if backend_proc.poll() is not None:
                print("\n[ERROR] Backend stopped running.")
                break
                
            if frontend_proc.poll() is not None:
                print("\n[ERROR] Frontend stopped running.")
                break
                
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        # Kill both processes on exit
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=2)
        except Exception:
            pass
        try:
            frontend_proc.terminate()
            frontend_proc.wait(timeout=2)
        except Exception:
            pass
        print("Servers stopped successfully.")

if __name__ == "__main__":
    main()
