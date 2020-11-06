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
    // Then print out the value to the console for now
    .then(result => {
        console.log(result);
    });

    // Finally load the Sent mailbox
    load_mailbox('sent');
    return false
  };
 };

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}