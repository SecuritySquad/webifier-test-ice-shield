"use strict";

var page = require('webpage').create(),
    system = require('system'),
    fs = require('fs');

var logFileName = "./logs/" + new Date().toISOString() + ".log";


page.onConsoleMessage = function (msg) {
    fs.write(logFileName, new Date().toISOString() + "\t" + msg + "\n", "a");
};

page.onAlert = function (msg) {
    fs.write(logFileName, new Date().toISOString() + "\t ALERT:\t" + msg + "\n", "a");
};

page.onInitialized = function () {
    page.evaluate(function () {
        if (document.documentElement === null) return;

        console.log(document.documentElement.innerHTML);
        console.log("about to proxy prototype methods... " +
            document.getElementsByTagName("*").length +
            " elements do already exist.");

        var suspiciousElementNames = ["embed", "object", "applet", "script", "iframe"];

        document.$createElement = document.createElement;
        document.createElement = function (elementName) {
            if (suspiciousElementNames.indexOf(elementName) > -1) {
                console.log("suspicious element created: " + elementName);
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
    });
};

if (system.args.length === 1) {
    console.log('Usage: vadlidate.js <some URL>');
    phantom.exit(1);
} else {
    page.open(system.args[1], function (status) {
        if (status === "success") {
            phantom.exit();
        }
        else {
            console.log("Could not open page: " + page.url);
            phantom.exit(1);
        }
    });
}
