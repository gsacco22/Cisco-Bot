import json
import sys
from pathlib import Path

import requests
import webexteamssdk
from requests.packages.urllib3.exceptions import InsecureRequestWarning


# Locate the directory containing this file and the repository root.
# Temporarily add these directories to the system path so that we can import
# local files.
here = Path(__file__).parent.absolute()
repository_root = (here / ".." ).resolve()

sys.path.insert(0, str(repository_root))

import env_lab  # noqa
import env_user  # noqa


# Disable insecure request warnings
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


# Functions
def get_amp_events(
    host=env_lab.AMP.get("host"),
    client_id=env_user.AMP_CLIENT_ID,
    api_key=env_user.AMP_API_KEY,
):
    """Get a list of recent events from Cisco AMP."""
    url = f"https://{client_id}:{api_key}@{host}/v1/events"

    response = requests.get(url, verify=False)
    response.raise_for_status()

    events_list = response.json()["data"]
    return events_list


# If this script is the "main" script, run...
if __name__ == "__main__":
    #TODO Get the list of events from AMP; Please call the right function
    # Hint: Call the function and assign it to variable "amp_events"
    amp_events = get_amp_events()
    #TODO: Enter the specific event you are interested in to find from the result Hint: malware execute event id is 1107296272
    # Hint: Create a variable "malware_event_id" assign the malware execute event id 
    malware_event_id = 1107296272
    count = 0
    for event in amp_events:
        if event["event_type_id"] == malware_event_id:
            count=count+1
            
    print(count)