document.addEventListener("DOMContentLoaded", function (event) {
    // Use buttons to toggle between views
    document
      .querySelector("#inbox")
      .addEventListener("click", () => load_mailbox("inbox"));
    document
      .querySelector("#sent")
      .addEventListener("click", () => load_mailbox("sent"));
    document
      .querySelector("#archived")
      .addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);
  
    // handler to send email
    document.getElementById("sent-input").addEventListener("click", sendEmail);

    // By default, load the inbox
    load_mailbox("inbox");
  });
  
  function sendEmail(event) {
    //handler email inputs
    event.preventDefault()
    const form = document.getElementById("compose-form");
    const recipients = document.getElementById("compose-recipients");
    const subject = document.getElementById("compose-subject");
    const body = document.getElementById("compose-body");
    
    const email = {
      recipients: recipients.value ,
      subject: subject.value ,
      body: body.value ,
    };
  
    fetch("emails", {
      method: "POST",
      body: JSON.stringify(email),
    })
      .then((response) => response.json())
      .then(data => {
        span = form.querySelector('span')
        if (span) {
          span.remove()
        }
        if ( data.error ) {
          const errorSpan = document.createElement('span')
          errorSpan.className = 'text-danger'
          errorSpan.textContent = `${data.error}`
          errorSpan.textContent = `${data.error}`
          recipients.insertAdjacentElement("afterend", errorSpan);
        }
        })
      .catch((err) =>{
        console.log(err)
  })
      ;
  }
  
  function compose_email(_, relpy={recipient:"", subject:"", body:""}) {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";
    document.querySelector("#email-view").style.display = "none";
  
    // Clear out composition fields or add recipients, subject
    const {recipient, subject, body} = relpy;
    let newSubject = "";
    if (subject.length == 0){
        newSubject = "";
    } else if(!subject.startsWith('Re:')){
        newSubject = `Re: ${subject}`;
    } else {
        newSubject = subject;
    }

    document.querySelector("#compose-recipients").value = recipient;
    document.querySelector("#compose-subject").value = newSubject;
    document.querySelector("#compose-body").value = body;
  }
  
  function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-view").style.display = "none";
  
    fetchEmails(mailbox);
  }
  
  function fetchEmails(mailbox) {
    fetch(`/emails/${mailbox}`)
      .then((response) => response.json())
      .then((data) =>renderEmailList(data, mailbox))
      .catch((err) => console.log(err));
  }
  
  function fetchEmail(emailId, mailbox) {
    fetch(`/emails/${emailId}`)
      .then((response) => response.json())
      .then((data) => {
        renderEmailView(data, mailbox);
        if (!data.read) {
          updateData(emailId, {read: true});
        }
      })
      .catch((err) => console.log(err));
  }
  
  function updateData(emailId, data) {
    fetch(`/emails/${emailId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  
  function renderEmailList(emails, mailbox) {
    const emailsView = document.querySelector("#emails-view");
    emailsView.innerHTML = "";
    const emailList = createEmailList(emails, mailbox);
    emailsView.appendChild(emailList);
  }
  
  function renderEmailView(fetchEmail, mailbox) {
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-view").style.display = "block";
    const emailView = document.querySelector("#email-view");
    emailView.innerHTML = "";
    const email = createEmailView(fetchEmail, mailbox);
    emailView.appendChild(email);
  }
  
  function createEmailView(email, mailbox) {
    const headersContainer = document.createElement("div");
    let headers = [];
    headers.push(createHeader("from", email.sender));
    headers.push(createHeader("to", email.recipients));
    headers.push(createHeader("subject", email.subject));
    headers.push(createHeader("timestamp", email.timestamp));
    if(mailbox !== 'sent'){
        const reply = prepareReply(email);
        const reply_btn = document.createElement("button");
        reply_btn.id = email.id;
        reply_btn.className = "btn btn-primary";
        reply_btn.style.width = "6rem";
        reply_btn.innerText = "Reply";
        reply_btn.addEventListener("click", () => compose_email(this, reply));
        headers.push(reply_btn);
    }
    const message = document.createElement("article");
    message.innerText = email.body;
    message.style.borderTop = "1px solid black";
    message.style.margin = "1rem 0";
    message.style.padding = "1rem 0";
    headers.push(message);
    headers.forEach((header) => headersContainer.appendChild(header));
  
    return headersContainer;
  }

  function prepareReply(email){
    const reply = {
        recipient: email.sender,
        subject: email.subject,
        body: `On ${email.timestamp} ${email.sender} wrote: \n${email.body} \n\n`
    };

    return reply;
  }
  
  function createEmailList(emails, mailbox) {
    const headersContainer = document.createElement("ul");
    const title = document.createElement("h1");
    title.innerText = mailbox;
    title.style.textTransform = "capitalize";
    headersContainer.appendChild(title);
    headersContainer.className = "headers-container";
    for (const email of emails) {
      const wrapEmail = document.createElement("li");
      const boxEmail = document.createElement("div");
      const archivedBtn = document.createElement('a');
      archivedBtn.href = `/`
      if (email.archived){
        archivedBtn.innerText = "Unarchived";
        archivedBtn.classList.add('btn', 'btn-outline-primary', 'd-{inline-block}');
        archivedBtn.addEventListener("click", () => updateData(email.id, {archived: false}));
      } else{
        archivedBtn.innerText = "Archived";
        archivedBtn.classList.add('btn', 'btn-primary', 'd-{inline-block}');
        archivedBtn.addEventListener("click", () => updateData(email.id, {archived: true}));
      }
      boxEmail.addEventListener("click", () => fetchEmail(email.id, mailbox));
      wrapEmail.classList.add("card", "my-3", "p-2", "email_li");
      if (email.read) {
        wrapEmail.style.backgroundColor = "rgb(219, 219, 219)";
      } else {
        wrapEmail.style.backgroundColor = "white";
      }
      let headers = [];
      headers.push(createHeader("from", email.sender));
      headers.push(createHeader("to", email.recipients));
      headers.push(createHeader("subject", email.subject));
      headers.push(createHeader("timestamp", email.timestamp));
      headers.forEach((header) => boxEmail.appendChild(header));
      wrapEmail.appendChild(boxEmail)
      if (mailbox === "inbox" || mailbox === "archive" ){
        wrapEmail.appendChild(archivedBtn)
      }
      headersContainer.appendChild(wrapEmail);
    }
    return headersContainer;
  }

  function createHeader(headerText, content) {
    const header = document.createElement("div");
    header.classList.add("my-1");
    header.innerHTML = `<strong>${headerText}:</strong> ${content}`;
    return header;
  }
  