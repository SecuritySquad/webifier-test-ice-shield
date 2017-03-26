var p = document.createElement("p");
p.id = "malicious";
p.innerHTML = "achtung!";
document.body.appendChild(p);

console.log("malicious code was executed!!");
alert("malicious alert!");