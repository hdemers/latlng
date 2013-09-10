"""
URL routes declarations.

All views are currently declared here.

"""
import os

import requests
from flask import render_template, request, jsonify

from latlng import app, make_json_error, config

mailgun_url = os.environ.get("MAILGUN_API_URL") + "/latlng.in/messages"
mailgun_key = os.environ.get("MAILGUN_API_KEY")


@app.errorhandler(Exception)
def error_handler(error):
    return make_json_error(error)


@app.route('/')
def index():
    """An OpenStreet map showing your position.
    Configuration options are set here and available to the client via the
    global variable `appConfig`, see templates/base.html.
    """
    webapp_config = {
        'cloudmadeApiKey': config.cloudmade_api_key,
        'peerserverApiKey': config.peerserver_api_key,
    }
    return render_template('index.html', config=webapp_config)


@app.route("/invite", methods=['POST'])
def invite():
    if request.method == 'POST':
        subject = "You have been invited to share your location"
        text = """Your friend {} wants to know where you are.

Click here {} to share both your locations.""".format(
            request.json['from'], request.json['url'])

        data = {
            'from': request.json['from'],
            'to': request.json['to'],
            'subject': subject,
            'text': text,
        }
        response = requests.post(mailgun_url, auth=("api", mailgun_key),
                                 data=data)
        if response.status_code not in [200]:
            raise Exception(response.reason, response.status_code)
        return jsonify({})


def in_production():
    return os.environ.get("IS_PRODUCTION", "").lower() in ['true', 'yes']
