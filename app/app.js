/**
 * App Initializer
 */
$(document).ready(function () {
	app.initialized()
		.then(function (_client) {
			window.client = _client;
			registerClickEventHandlers();
			initializeTicketDetails();
		})
		.catch(function (error) {
			console.error('Error during initialization' + error);
		});
});
function initializeTicketDetails() {
	getTicketDetails(function (ticketData) {
		checkAndCreateIssue(
			ticketData.ticket.id,
			function () {
				// The record already exists - indicates it is already associated with Github issue
				console.log("issues is found");
				$("#createIssue").hide();

			},
			function (error) {
				//404 - Indicates that the record is not found in the data storage
				$("#viewIssue").hide();

			})
	}, function (error) {
		console.error("Error occurred while fetching ticket details", error);
	});
}
/**
 * Register the click event handlers for `Create Issue` and `View Issue Details` buttons
 */
function registerClickEventHandlers() {
	$('#createIssue').click(function () {
		createIssue();
	});

	$('#viewIssue').click(function () {
		viewIssue();
	});
	$('#searchIssue').click(function () {
		searchIssue();
	});

}


// createIssue() function goes here 

function createIssue() {
	console.log("Proceeding to create issue from the ticket");
	getTicketDetails(function (ticketData) {
		checkAndCreateIssue(
			ticketData.ticket.id,
			function () {
				// The record already exists - indicates it is already associated with Github issue
				showNotification('warning', 'Hold on 🙅🏻‍♂️', 'A Github issue has been already created for this ticket. Click on \'View Issue Details\' button');
			},
			function (error) {
				//404 - Indicates that the record is not found in the data storage
				if (error.status === 404) {
					createIssueHelper(ticketData);
				}
			})
	}, function (error) {
		console.error("Error occurred while fetching ticket details", error);
	});
}

// createIssueHelper(ticketData) function goes here

function createIssueHelper(ticketData) {
	var options = {
		headers: {
			"Authorization": 'token <%= access_token %>',
			"User-Agent": 'sampleFresh Sample User Agent'
		},
		body: JSON.stringify({
			"title": ticketData.ticket.subject,
			"body": ticketData.ticket.description_text
		}),
		isOAuth: true
	};
	client.request.post(`https://api.github.com/repos/<%= iparam.github_repo %>/issues`, options)
		.then(function (data) {
			// TODO : Add try catch block
			response = JSON.parse(data.response);
			var ticketObj = { ticketID: ticketData.ticket.id, issueID: response.id, issueNumber: response.number };
			showNotification('success', 'Yay 🎉', 'A Github issue is successfully created for this ticket')
			$("#createIssue").hide();

			setData(ticketObj);
		})
		.catch(function (error) {
			console.error("error", error);
		})
}

// viewIssue() Function goes here 

function viewIssue() {
	getTicketDetails(function (data) {
		client.interface.trigger("showModal", {
			title: "Github Issue Details",
			template: "./modal/modal.html",
			data: data.ticket
		});
	}, function (error) {
		console.error(error);
	});
}

function fetchIssue(issueID) {
	var options = {
		headers: {
			Authorization: 'token <%= access_token %>',
			'User-Agent': 'sampleFresh Sample User Agent'
		},
		isOAuth: true
	};
	client.request.get(`https://api.github.com/repos/<%= iparam.github_repo %>/issues/${issueID}`, options)
		.then(function (data) {
			try {
				data = JSON.parse(data.response);
				var html = '';
				html = `<h3> Issue title : ${data.title} </h3>
				  <p>Description : ${data.body}</p>
				  <p> Issue Number : ${data.number}</p>
				  <p>Issue ID ; ${data.id}</p>
				  <p> Issue Status : ${data.state}</p>`;
				$('#modal').append(html);
			} catch (error) {
				console.error("Error while attempting to show issue", error);
			}
		})
		.catch(function (error) {
			console.error("error", error);
		});
}

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
					Seems like there's no issue associated with this ticket. Please create one using 'Create Issue' button
				  </div>`;
				$('#modal').append(html);
			}
		})
}


/**
 *
 * @param {function} success Callback if the ticket details are fetched successfully
 * @param {function} error Callback if there's an error
 */
function getTicketDetails(success, error) {
	client.data.get('ticket')
		.then(success)
		.catch(error);
}

/**
 * Check if the ticket is already linked to a Github issue. If not, create.
 * @param {Number} ticketID ID of the curent ticket
 * @param {function} issueExistCallback Callback if the issue exists
 * @param {function} issueDoesntExistCallback Callback if the issue doesnt exist
 */
function checkAndCreateIssue(ticketID, issueExistCallback, issueDoesntExistCallback) {
	var dbKey = String(`fdTicket:${ticketID}`).substr(0, 30);
	client.db.get(dbKey)
		.then(issueExistCallback)
		.catch(issueDoesntExistCallback);
}

//searchIssue 

function searchIssue() {


	client.interface.trigger("showModal", {
		title: "Issue Search",
		template: "./modal/searchIssuesModal.html",
		// data: data.ticket
	});

	// var options = {
	// 	headers: {
	// 		Authorization: 'token <%= access_token %>',
	// 		'User-Agent': 'sampleFresh Sample User Agent'
	// 	},
	// 	isOAuth: true
	// };
	// client.request.get(`https://api.github.com/search/issues?q=adf`, options)
	// 	.then(function (data) {
	// 		try {
	// 			data = JSON.parse(data.response);
	// 			console.log(data)
	// 		} catch (error) {
	// 			console.error("Error while attempting to show issue", error);
	// 		}
	// 	})
	// 	.catch(function (error) {
	// 		console.error("error", error);
	// 	});
}


// setData(data) Function goes here 

function setData(data) {
	var dbKey = String(`fdTicket:${data.ticketID}`).substr(0, 30);
	var dbKey2 = String(`gitIssue:${data.issueNumber}`).substr(0, 30);
	Promise.all([client.db.set(dbKey, { issue_data: data }), client.db.set(dbKey2, { issue_data: data })]).then(function () {
		console.info('Mapping Data Saved');
	}).catch(function (error) {
		console.error("Unable to persist data : ", error);
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
