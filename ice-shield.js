"use strict";

var page = require('webpage').create(),
    system = require('system'),
    fs = require('fs');

var logFileName = "./logs/" + new Date().toISOString() + ".log";


page.onConsoleMessage = function (msg) {
    fs.write(logFileName, new Date().toISOString() + "\t" + msg + "\n", "a");
    console.log("LOG:\t" + msg);
};

page.onAlert = function (msg) {
    fs.write(logFileName, new Date().toISOString() + "\t ALERT:\t" + msg + "\n", "a");
    console.log("ALERT:\t" + msg);
};

page.onInitialized = function () {
    page.evaluate(function () {
        if (document.documentElement === null) return;

        console.log(document.documentElement.innerHTML);
        console.log("about to proxy prototype methods... " +
            document.getElementsByTagName("*").length +
            " elements do already exist.");

        document.suspiciousElementNames = ["embed", "object", "applet", "script", "iframe"];
        document.elementsCreatedCounts = {};
        document.suspiciousElementNames.forEach(function (elementName) {
            document.elementsCreatedCounts[elementName] = 0
        });

        document.$createElement = document.createElement;
        document.createElement = function (elementName) {
            elementName = elementName.toLowerCase();
            if (document.suspiciousElementNames.indexOf(elementName) > -1) {
                console.log("suspicious element created: " + elementName);
                document.elementsCreatedCounts[elementName]++;
            }
            return document.$createElement(elementName);
        };

        Node.prototype.$appendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function (child) {
            var source = document.currentScript.src || "<<inline>>";

            var callerName = "<<main>>";
            var isStrict = (function () {
                return !this;
            })();
            if (!isStrict) {
                var caller = this.appendChild.caller;
                if (caller) {
                    callerName = caller.name;
                }
            }

            console.log("appending " + child.tagName.toLowerCase() + "#" + child.id +
                " to " + this.tagName.toLowerCase() + "#" + this.id +
                " from " + callerName + "@" + source);
            return this.$appendChild(child);
        };
        console.log("proxied prototype methods successfully!");
    });
};

if (system.args.length < 2) {
    console.log('Usage: ice-shield-js.js <some URL>');
    phantom.exit(1);
} else {
    page.open(system.args[1], function (status) {
        if (status === "success") {
            var sum = page.evaluate(function () {
                var sum = 0;
                document.suspiciousElementNames.forEach(function (elementName) {
                    sum += document.elementsCreatedCounts[elementName];
                });
                return sum;
            });
            var elementsCounts = page.evaluate(function () {
                return document.elementsCreatedCounts;
            });
            var result = "MALICIOUS";

            if (sum <= 5) {
                result = "CLEAN";
            }
            else if (sum <= 10) {
                result = "SUSPICIOUS";
            }
            var id = system.env["ID"] || "";
            console.log(id + ":" + JSON.stringify({
                    result: result,
                    info: {
                        elementsCounts: elementsCounts,
                        totalSuspiciousElements: sum
                    }
                }));
            phantom.exit();
        }
        else {
            console.log("Could not open page: " + page.url);
            phantom.exit(1);
        }
    });
}
