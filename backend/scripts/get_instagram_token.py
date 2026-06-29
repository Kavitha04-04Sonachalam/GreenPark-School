import sys
import os
import urllib.parse
import http.server
import socketserver
import requests
import webbrowser

APP_ID = "999672995847370"
APP_SECRET = "ecb9e85164437c8859997fb0127d3fcd"
REDIRECT_URI = "http://localhost:8000/callback"

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress server logging for cleaner output
        return

    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        if "code" in params:
            code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            
            html = """
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f8f9fa;">
                    <div style="max-width: 500px; margin: auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; margin-bottom: 10px;">Authorization Successful!</h2>
                        <p style="color: #666;">You can close this tab now. The console will display your token and business ID.</p>
                    </div>
                </body>
            </html>
            """
            self.wfile.write(html.encode("utf-8"))
            
            # Process the code
            self.server.code = code
            self.server.running = False
        else:
            self.send_response(400)
            self.end_headers()

def run_helper():
    # 1. Print authorization URL
    auth_url = (
        "https://www.facebook.com/v23.0/dialog/oauth"
        f"?client_id={APP_ID}"
        f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        f"&scope=instagram_basic,pages_read_engagement,pages_show_list"
    )
    
    print("=" * 60)
    print("GreenPark School Instagram Integration Token Generator")
    print("=" * 60)
    print("\nOpening your browser to authenticate...")
    webbrowser.open(auth_url)
    print(f"\nIf browser doesn't open, copy and paste this URL into your browser:\n\n{auth_url}\n")
    
    # 2. Start local callback listener
    server = socketserver.TCPServer(("localhost", 8000), CallbackHandler)
    server.code = None
    server.running = True
    
    print("Waiting for callback on http://localhost:8000/callback...")
    while server.running:
        server.handle_request()
        
    code = server.code
    if not code:
        print("Failed to receive authorization code.")
        return
        
    print("\n[+] Received authorization code. Exchanging for short-lived access token...")
    
    # 3. Exchange code for short-lived access token
    token_url = "https://graph.facebook.com/v23.0/oauth/access_token"
    resp = requests.get(token_url, params={
        "client_id": APP_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": APP_SECRET,
        "code": code
    })
    
    if resp.status_code != 200:
        print("[-] Error exchanging token:", resp.json())
        return
        
    token_data = resp.json()
    short_token = token_data.get("access_token")
    
    # 4. Exchange for long-lived access token (expires in 60 days)
    print("[+] Exchanging for long-lived access token...")
    long_token_url = "https://graph.facebook.com/v23.0/oauth/access_token"
    resp = requests.get(long_token_url, params={
        "grant_type": "fb_exchange_token",
        "client_id": APP_ID,
        "client_secret": APP_SECRET,
        "fb_exchange_token": short_token
    })
    
    if resp.status_code != 200:
        print("[-] Error exchanging long-lived token:", resp.json())
        return
        
    long_token_data = resp.json()
    long_token = long_token_data.get("access_token")
    
    # 5. Fetch Pages and associated Instagram Business Accounts
    print("[+] Fetching managed Facebook Pages and Instagram Business Accounts...")
    pages_url = "https://graph.facebook.com/v23.0/me/accounts"
    resp = requests.get(pages_url, params={
        "fields": "instagram_business_account,name",
        "access_token": long_token
    })
    
    if resp.status_code != 200:
        print("[-] Error fetching Pages:", resp.json())
        return
        
    pages_data = resp.json()
    pages_list = pages_data.get("data", [])
    
    if not pages_list:
        print("\n[-] NO Facebook Pages found managed by this user.")
        print("    Please ensure the user managing the app has Admin roles on the Facebook Page.")
        return
        
    inst_business_id = None
    connected_page_name = None
    
    print("\nManaged Pages found:")
    for page in pages_list:
        page_name = page.get("name")
        page_id = page.get("id")
        ig_account = page.get("instagram_business_account")
        
        print(f" - Page: '{page_name}' (ID: {page_id})")
        if ig_account:
            inst_business_id = ig_account.get("id")
            connected_page_name = page_name
            print(f"   [!] Found connected Instagram Business Account ID: {inst_business_id}")
        else:
            print("   [x] No connected Instagram Business Account found for this Page.")
            
    if not inst_business_id:
        print("\n[-] No Instagram Business Account was found connected to any of the pages.")
        print("    Please ensure your Instagram account is converted to a Business/Creator account")
        print("    and linked to your Facebook Page in Page Settings.")
        return

    # 6. Update .env file automatically
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        print(f"\n[+] Updating credentials inside '{env_path}'...")
        with open(env_path, "r") as f:
            lines = f.readlines()
            
        new_lines = []
        has_business_id = False
        has_access_token = False
        
        for line in lines:
            if line.startswith("INSTAGRAM_BUSINESS_ID="):
                new_lines.append(f"INSTAGRAM_BUSINESS_ID={inst_business_id}\n")
                has_business_id = True
            elif line.startswith("INSTAGRAM_ACCESS_TOKEN="):
                new_lines.append(f"INSTAGRAM_ACCESS_TOKEN={long_token}\n")
                has_access_token = True
            else:
                new_lines.append(line)
                
        if not has_business_id:
            new_lines.append(f"INSTAGRAM_BUSINESS_ID={inst_business_id}\n")
        if not has_access_token:
            new_lines.append(f"INSTAGRAM_ACCESS_TOKEN={long_token}\n")
            
        with open(env_path, "w") as f:
            f.writelines(new_lines)
            
        print("[+] .env file successfully updated!")
    else:
        print(f"\n[-] .env file not found at {env_path}")
        print(f"    Instagram Business ID: {inst_business_id}")
        print(f"    Instagram Access Token: {long_token}")
        
    print("\n" + "=" * 60)
    print("SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_helper()
