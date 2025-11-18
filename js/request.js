class Request {
    constructor(url, parameters, success, error) {
        this.url = url;
        this.parameters = parameters;
        this.success = success;
        this.error = error;
    }

    get() {
        const checked = this.#checkSuccessError(this.success, this.error);
        if (this.parameters.data !== undefined) {
            this.url += '?' + new URLSearchParams(this.parameters.data);
        }
        fetch(this.url)
            .then(function(response) {
                return response.json();
            })
            .then(checked.success)
            .catch(checked.error);
    }
    post() {
        const checked = this.#checkSuccessError(this.success, this.error);
        fetch(this.url,
            {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.parameters.data)
            })
            .then(checked.success)
            .catch(checked.error);
    }

    #checkSuccessError(success, error) {
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
}

export {Request}