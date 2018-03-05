#!/usr/bin/env python
import urllib2
import json

url = "https://api.travis-ci.org/repo/johncclayton%2Felectric/builds?build.state=passed"
request_headers = {
    'User-Agent': 'electric',
    'Travis-API-Version': 3,
    'Accept': 'application/vnd.travis-ci.2+json'
}

request = urllib2.Request(url, headers=request_headers)
http_response = urllib2.urlopen(request)
content = json.load(http_response)

builds = content['builds']
if builds:
    for build in builds:
        if build['state'] != 'passed':
            continue

        print build['number']
        exit(0)
else:
    print "Failed to find latest build number at travis"
    exit(-1)
