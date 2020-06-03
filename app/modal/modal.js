var issueDetails;
var ticketDetails;
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
  var ticketID = ticket.id;
  ticketDetails = ticket;
  getIssue(ticketID, function (data) {
    issueNumber = data.issue_data.issueNumber;
    ticketDetails.issueNumber = issueNumber
    fetchIssue(issueNumber);
  });
  $('#updateBtn').click(function () {
    updateStatus();
  });
  $('#lockBtn').click(function () {
    lockIssues();
  });
  $('#unLockBtn').click(function () {
    unLockBtnIssue();
  });

}

/**
 * Retrieve the issue from data storage
 * @param {Number} ticketID Ticket ID
 * @param {function} callback Callback function
 */
function getIssue(ticketID, callback) {
  var dbKey = String(`fdTicket:${ticketID}`).substr(0, 30);
  client.db.get(dbKey)
    .then(callback)
    .catch(function (error) {
      //404 - Indicates that the record is not found in the data storage
      if (error.status === 404) {
        console.error("No issue found for ticket", error);
        var html = '';
        html = `<div class="alert alert-warning" role="alert">
                  <img src="https://media.tenor.com/images/a48310348e788561dc238b6db1451264/tenor.gif" width="120px"/>
                  <hr>
                  Seems like there's no issue associated with this ticket. Please created one using 'Create Issue' button
                </div>`;
        $('#modal').append(html);
      }
    })
}

/**
 * Function to fecth issue from github, authorization is done using Oauth
 * @param {string} issueID  Issue number to query specific  ticket from github
 */
function fetchIssue(issueID) {
  var options = {
    headers: {
      Authorization: 'token <%= access_token %>',
      'User-Agent': 'FreshHuddle Sample User Agent'
    },
    isOAuth: true
  };
  client.request.get(`https://api.github.com/repos/<%= iparam.github_repo %>/issues/${issueID}`, options)
    .then(function (data) {
      try {
        data = JSON.parse(data.response);
        issueDetails = data;
        console.log(issueDetails)



        if (issueDetails.state == 'closed') {

          $('#updateBtn').html("Open Issue")
          $('#lockBtn').hide();
          $('#selectDiv').hide();

          $('#unLockBtn').hide();
        } else {
          $('#updateBtn').html("Close Issue");
          if (issueDetails.locked) {

            $('#lockBtn').hide();
            $('#selectDiv').hide();
            $('#unLockBtn').show();

          } else {
            $('#lockBtn').show();
            $('#unLockBtn').hide();
            $('#selectDiv').show();
          }
        }
        var html = '';
        html = `<h3> Issue title : ${data.title} </h3><p>Description : ${data.body}</p> <p> Issue Number : ${data.number}</p> <p>Issue ID ; ${data.id}</p><p> Issue Status : ${data.state}</p>`;
        $('#modal').html(html);
      } catch (error) {
        console.error("Error while attempting to show issue", error);
      }
    })
    .catch(function (error) {
      console.error("error", error);
    });
}
function updateStatus() {
  //
  // console.log(($('#updateBtn').html() == 'Open Issue') ? 'open' : "closed")
  // console.log($('#updateBtn').html())
  // return;
  var reqData = {
    "title": issueDetails.title,
    "body": issueDetails.body,
    "assignees": [

    ],
    // "milestone": 1,
    "state": ($('#updateBtn').html() == 'Open Issue') ? 'open' : "closed",
    "labels": [
      // "bug"
    ]
  }
  var options = {
    headers: {
      "Authorization": 'token <%= access_token %>',
      "User-Agent": 'sampleFresh Sample User Agent'
    },
    body: JSON.stringify(reqData),
    isOAuth: true
  };
  console.log(ticketDetails)
  console.log(issueDetails)
  var issueID = ticketDetails.issueNumber
  client.request.post(`https://api.github.com/repos/<%= iparam.github_repo %>/issues/${issueID}`, options)
    .then(function (data) {
      try {
        data = JSON.parse(data.response);
        issueDetails = data;
        console.log(issueDetails)
        if (issueDetails.state == 'closed') {

          $('#updateBtn').html("Open Issue");


        } else {
          $('#updateBtn').html("Close Issue")
        }
        fetchIssue(issueID);
        // var html = '';
        // html = `<h3> Issue title : ${data.title} </h3><p>Description : ${data.body}</p> <p> Issue Number : ${data.number}</p> <p>Issue ID ; ${data.id}</p><p> Issue Status : ${data.state}</p>`;
        // $('#modal').html(html);
      } catch (error) {
        console.error("Error while attempting to show issue", error);
      }
    })
    .catch(function (error) {
      console.error("error", error);
    });
}

function lockIssues() {
  console.log($('#reasonSelect').val())
  var reqData = {
    "locked": false,
    "active_lock_reason": $('#reasonSelect').val()
  }
  var options = {
    headers: {
      "Authorization": 'token <%= access_token %>',
      "User-Agent": 'sampleFresh Sample User Agent'
    },
    body: JSON.stringify(reqData),
    isOAuth: true
  };

  var issueID = ticketDetails.issueNumber
  client.request.put(`https://api.github.com/repos/<%= iparam.github_repo %>/issues/${issueID}/lock`, options)
    .then(function (data) {
      try {
        $('#lockBtn').hide();

        // $('#selectDiv').hide();

        $('#unLockBtn').show();
        fetchIssue(issueID)
        data = JSON.parse(data.response);

      } catch (error) {
        console.error("Error while attempting to show issue", error);
      }
    })
    .catch(function (error) {
      console.error("error", error);
    });
}

function unLockBtnIssue() {
  console.log($('#reasonSelect').val())
  // var reqData = {
  //   "locked": false,
  //   "active_lock_reason": $('#reasonSelect').val()
  // }
  var options = {
    headers: {
      "Authorization": 'token <%= access_token %>',
      "User-Agent": 'sampleFresh Sample User Agent'
    },
    // body: JSON.stringify(reqData),
    isOAuth: true
  };

  var issueID = ticketDetails.issueNumber
  client.request.delete(`https://api.github.com/repos/<%= iparam.github_repo %>/issues/${issueID}/lock`, options)
    .then(function (data) {
      try {
        $('#lockBtn').show();
        // $('#selectDiv').show();

        $('#unLockBtn').hide();
        fetchIssue(issueID)
        console.log(data)
        data = JSON.parse(data.response);

      } catch (error) {
        console.error("Error while attempting to show issue", error);
      }
    })
    .catch(function (error) {
      console.error("error", error);
    });
}