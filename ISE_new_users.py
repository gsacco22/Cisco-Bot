import json, csv
import sys
from pathlib import Path
import pdb
import requests
from requests.auth import HTTPBasicAuth
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

def connect():
    url = "https://198.18.133.27:9060/ers/config/node"
    #headers = urllib3.util.make_headers(accept_encoding="Application/JSON", basic_auth='admin:C1sco12345')
    #http = urllib3.PoolManager()
    #request = http.request('GET', url, headers=headers)
    #print(request.status)
    #print(request.data.decode('utf-8'))

    headers = {
        'Accept': 'Application/JSON',
        'Content-Type': 'Application/JSON'
    }
    response = requests.get(url, auth=('admin', 'C1sco12345'), headers=headers, verify=False)
    
    # events_list = response.json()
    #print(response.json())
    
def add_user(name, password):
    #pdb.set_trace()
    url = "https://198.18.133.27:9060/ers/config/internaluser"
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    input_json = {
        "InternalUser" : {
            "name": str(name),
            "password": str(password),
            "changePassword": False,
            "identityGroups": "a1740510-8c01-11e6-996c-525400b48521"
        }
    }
    response = requests.post(url, auth=('admin', 'C1sco12345'), headers=headers, json=input_json, verify=False)
    if(response.status_code != 201):
        print("Creating user: " + str(name) + " failed")
        print(response.json())
    else:
        print("Added "+ str(name) +" successfully!!")
        

def get_users():
    #pdb.set_trace()
    data = {}
    counter = 0
    fieldnames = ("name","password")
    jsonfile = open('users.json', 'w')
    with open("users.csv") as csvFile:
        csvReader = csv.DictReader(csvFile, fieldnames)
        for row in csvReader:
            key = counter
            counter = counter + 1
            data[key] = row 
    jsonfile.write(json.dumps(data, indent=4))
    jsonfile.close()

# If this script is the "main" script, run...
if __name__ == "__main__":
    get_users()
    with open("users.json") as json_file:
        data = json.load(json_file)
        counter = 0
        while counter < len(data):
            add_user(data[str(counter)]["name"], data[str(counter)]["password"])
            counter = counter + 1