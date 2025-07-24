def create_response(status, message, data=None):
    return {
        "responseStatus": {"status": status, "message": message},
        "responseData": data,
    }
