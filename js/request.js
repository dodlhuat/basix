const request = {
    get(url, parameters, success, error) {
        const checked = checkSuccessError(success, error);
        if (parameters.data !== undefined) {
            url += '?' + new URLSearchParams(parameters.data);
        }
        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(checked.success)
            .catch(checked.error);
    },
    post(url, parameters, success, error) {
        const checked = checkSuccessError(success, error);
        fetch(url,
            {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parameters.data)
            })
            .then(checked.success)
            .catch(checked.error);
    }
}

const checkSuccessError = (success, error) => {
    if (success === undefined) {
        success = function(data) {
            console.log(data);
        };
    }
    if (error === undefined) {
        error = function(error) {
            console.error(error);
        }
    }
    return {success, error};
}

export {request}