AngJobs - job board built by developers for developers
=======

Looking for a demo? - Check http://AngJobs.com which is based on this open source job board.


UI
====

This job board wants to be like the Gmail app, responsive, fast and easy to use. 


![](https://angjobs.com/angjobs-demo-inbox.jpg)

Mobile app
==
![](https://angjobs.com/angjobs-mobile-app.jpg)

Todo
===
+  Jobs list on the homepage
+  Create a simple jobs table
+  Create a jobs applied for table
+  Jobs detail page
+  **Upload resume functionality**
+ Add  /feed.rss endpoint with latest jobs
+ Import more jobs from external providers/api
+ Find and import some "remote jobs" providers from here https://github.com/lukasz-madon/awesome-remote-job
+ [Client side testing(unit test and e2e tests)](https://docs.angularjs.org/guide/unit-testing)
+ integrate the [Me-Api](https://github.com/danfang/me-api). Explore developers
+

**Other tasks**
+ Setup a continuous delivery service - build server

Future plans
==
+  Apply for jobs while offline(on the train). Use service worker?
+  Introduce typescript?
+  Android app based on phonegap/ionic frameworks
+  IOS app based on phonegap/ionic frameworks

Frameworks used or willing to use
==

- Angular
- TypeScript
- Web API
- Gulp
- Bower
- AppVeyor (for Continuous Integration)
- Testing(protractor for e2e)
- Ionic framework for mobile app, uses AngularJs

Setup for devs
==
The single page app is based on [ng.Net.Template](https://visualstudiogallery.msdn.microsoft.com/48d928e3-9b5c-4faf-b46f-d6baa7d9886c) by Dahln Farnes 

On server side it uses .NET C# to provide the JSON endpoints(~/api/...) and Entity Framework Code First apropach for the data layer.
The single page app code(javascript+css) is located in ~/Assets/app

To run the web app on Windows you need [Visual Studio]( https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx)
and [Sql Server Express](https://www.microsoft.com/en-gb/server-cloud/products/sql-server-editions/sql-server-express.aspx) both are free tools by Microsoft 

Run tests
==
To run unit tests use this command at your command prompt:

AngJobs\AngJobs>**karma start test/karma.conf.js**

![](https://dl.dropboxusercontent.com/u/45940875/Angjobs/tests-karma-angjobs.jpg)
