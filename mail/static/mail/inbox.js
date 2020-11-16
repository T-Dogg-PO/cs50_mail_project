document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add query selector for clicking on the button to send a new email
  document.querySelector('#compose-form').onsubmit = function() {
    // Assign each of the form fields to const variables
    const submitted_recipients = document.querySelector('#compose-recipients').value;
    const submitted_subject = document.querySelector('#compose-subject').value;
    const submitted_body = document.querySelector('#compose-body').value;

    // Send the POST request to our API
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: submitted_recipients,
            subject: submitted_subject,
            body: submitted_body,
        })
    })

    // Then put the response from the API request into JSON form
    .then(response => response.json())
    // Then load the Sent mailbox. This .then() section seems to be important (along with the return false below) for
    // making sure that new emails show up immediately in the Sent mailbox. Although I am not sure why this is the case
    .then(result => {
      load_mailbox('sent');
    })

    return false;
  };
 };

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send the GET request for the mailbox in question to our API
  fetch(`/emails/${mailbox}`)
  // Convert to JSON
  .then(response => response.json())
  // Then print the data to the page through the following function
  .then(emails => {
    // Loop through each email returned from the API and display them on the page
    emails.forEach(email => {
      // Create container div for each individual email (required for Bootstrap's grid system)
      const mail = document.createElement('div');
      mail.setAttribute('id', email.id); // ID set so that we can reference this container div if needed
      mail.setAttribute('class', 'container mail-item'); // Class doubles as mail-item for the CSS styling

      // Create div for each row that will appear in this inbox (required for Bootstrap's grid system)
      const row = document.createElement('div');
      row.setAttribute('id', `${email.id}-row`); // ID set so that we can reference this row element when appending information
      row.setAttribute('class', 'row');

      // Set the email background colour to white if unread, or grey if read
      mail.style.backgroundColor = email.read ? '#D3D3D3' : '#FFFFFF';

      // Create columns for each piece of information that will be displayed on the mailbox page (sender, subject and timestamp)
      const sender = document.createElement('div');
      sender.setAttribute('class', 'col sender'); // Multiple classes for CSS styling
      sender.innerHTML = email.sender;

      const subject = document.createElement('div');
      subject.setAttribute('class', 'col-6 subject'); // Multiple classes for CSS styling. col-6 used to make the subject column wider than the other columns
      subject.innerHTML = email.subject;

      const timestamp = document.createElement('div');
      timestamp.setAttribute('class', 'col timestamp'); // Multiple classes for CSS styling
      timestamp.innerHTML = email.timestamp;

      // Append each component of the mail item to this page. Must be in this order (i.e. load the container div, then the row div, then each column within that row)
      document.querySelector('#emails-view').append(mail);
      document.getElementById(email.id).append(row);
      document.getElementById(`${email.id}-row`).append(sender, subject, timestamp);

      // Add an event listener for this mail div that will redirect to that individual email
      const current_mailbox = document.querySelector('h3').innerHTML;
      mail.addEventListener('click', () => load_email(email.id, current_mailbox));

    })
  })
}

// Function for loading an individual email
function load_email(email_id, current_mailbox) {
  // Start by hiding the compose-view and emails-view, only showing the view for the single-email
  document.querySelector('#single-email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Make call to the API for the provided email
  fetch(`/emails/${email_id}`)
  // Convert response to json, log result to console
  .then(response => response.json())
  .then(email => {
    console.log(email);
    // Then start printing it out to the screen
    // Then create div's for each of the fields we will show for this email. Fill them in with our result
    document.getElementById('email-from').innerHTML = email.sender;
    document.getElementById('email-to').innerHTML = email.recipients;
    document.getElementById('email-subject').innerHTML = email.subject;
    document.getElementById('email-timestamp').innerHTML = email.timestamp;

    // Create the button for replying to this email
    document.getElementById('reply-button').innerHTML = ''; // Clear out any old buttons (not sure why they persist without clearing the old HTML first)
    const reply_button = document.createElement('button');
    reply_button.innerHTML = 'Reply';
    reply_button.addEventListener('click', () => reply(email));
    document.getElementById('reply-button').append(reply_button);

    // Create the archive button differently depending on if this email is currently archived or not
    document.getElementById('archive-button').innerHTML = ''; // Clear out any old buttons (not sure why they persist without clearing the old HTML first)
    if(current_mailbox === 'Inbox' || current_mailbox === 'Archive' ) {
      if(email.archived === true) {
        const archive_button = document.createElement('button');
        archive_button.innerHTML = 'Unarchive';
        archive_button.addEventListener('click', () => unarchive(email_id));
        document.getElementById('archive-button').append(archive_button);
      } else {
        const archive_button = document.createElement('button');
        archive_button.innerHTML = 'Archive';
        archive_button.addEventListener('click', () => archive(email_id));
        document.getElementById('archive-button').append(archive_button);
      }
    }

    document.getElementById('email-body').innerHTML = email.body;
    
    // Finally if the email was previously marked as unread, change it to read
    if(!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }
  })

}

// Function for archiving an email
function archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  .then(() => load_mailbox('inbox'));
}

// Function for un-archiving an email
function unarchive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then(() => load_mailbox('inbox'));
}


// Function for replying to an email
function reply(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Fill in some fields but leave others blank
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
  document.querySelector('#compose-body').value = '';

  // Add query selector for clicking on the button to send a new email
  document.querySelector('#compose-form').onsubmit = function() {
    // Assign each of the form fields to const variables
    const submitted_recipients = document.querySelector('#compose-recipients').value;
    const submitted_subject = document.querySelector('#compose-subject').value;
    const submitted_body = document.querySelector('#compose-body').value;

    // Send the POST request to our API
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: submitted_recipients,
            subject: submitted_subject,
            body: submitted_body,
        })
    })
    // Then put the response from the API request into JSON form
    .then(response => response.json())
    // Finally load the Sent mailbox
    .then(result => {
      load_mailbox('sent');
    })

    return false;
  };

    
};
 