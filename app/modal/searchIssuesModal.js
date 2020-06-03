$(document).ready(function () {
    app.initialized()
        .then(function (_client) {
            window.client = _client;
            client.instance.context()
                .then(function (context) {
                    onModalLoad(context.data);
                })
                .catch(function (error) {
                    console.error('error', error);
                });
        });
});

/**
 * Function that is triggered on Modal load.
 * @param {object} ticket  ticket that is fetched from parent
 */
function onModalLoad(ticket) {

    $('#submitBtn').click(function () {
        searchIssues();
    });

}

function searchIssues() {

    var serachText = $('#searchText').val();
    if (!serachText) {

        showNotification('danger', 'Search Values cannot empty', 'Fill values');
        return;
    }
    var options = {
        headers: {
            Authorization: 'token <%= access_token %>',
            'User-Agent': 'sampleFresh Sample User Agent'
        },
        isOAuth: true
    };
    client.request.get(`https://api.github.com/search/issues?q=${serachText}`, options)
        .then(function (data) {
            try {
                data = JSON.parse(data.response);
                console.log(data)
                var html = '';
                for (var i = 0; i < data.items.length; i++) {
                    var issue = data.items[i]
                    html = html + `   <div class="card"> <h5 class="card-title">${issue.title}</h5>
                    <p class="card-text">${issue.body}</p> 
                    <p class="card-text">Status: ${issue.state}</p> 
                    
                    <a href="${issue.html_url}" target="_blank" class="btn btn-primary">Go issues</a></div>`;
                }
                $('#card').append(html);

            } catch (error) {
                console.error("Error while attempting to show issue", error);
            }
        })
        .catch(function (error) {
            console.error("error", error);
        });
}



/**
 * Show notifications to the user using interface - notification API
 * @param {string} type Type of notification
 * @param {string} title Title of the message
 * @param {string} message Content of the notification message
 */
function showNotification(type, title, message) {
    
    client.interface.trigger("showNotify", {
        type: `${type}`,
        title: `${title}`,
        message: `${message}`
    }).catch(function (error) {
        console.error('Notification Error : ', error);
    });
}