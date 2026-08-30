"""One-time OAuth consent for GSC + GA4 read access. Saves ops/audit/google-token.json."""
import json, os, sys, warnings
warnings.filterwarnings("ignore")
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

HERE = os.path.dirname(os.path.abspath(__file__))
CLIENT = os.path.join(HERE, "google-oauth-client.json")
TOKEN = os.path.join(HERE, "google-token.json")
SCOPES = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
]

def get_creds():
    creds = None
    if os.path.exists(TOKEN):
        creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT, SCOPES)
        creds = flow.run_local_server(port=0, open_browser=True)
        with open(TOKEN, "w") as f:
            f.write(creds.to_json())
    return creds

if __name__ == "__main__":
    creds = get_creds()
    from googleapiclient.discovery import build
    sc = build("searchconsole", "v1", credentials=creds)
    sites = sc.sites().list().execute().get("siteEntry", [])
    print("GSC sites:", [(s["siteUrl"], s["permissionLevel"]) for s in sites])
    from google.analytics.admin_v1beta import AnalyticsAdminServiceClient
    admin = AnalyticsAdminServiceClient(credentials=creds)
    for acct in admin.list_account_summaries():
        for p in acct.property_summaries:
            print("GA4 property:", p.property, p.display_name)
