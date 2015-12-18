AngJobs - job board for developers
=======

[![Join the chat at https://gitter.im/victorantos/AngJobs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/victorantos/AngJobs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Looking for a demo? - check [AngJobs.com](http://AngJobs.com)

*update: current repository matches live website, additionally it automatically imports about 500 real jobs when you run it for the first time!*

Testimonials
===
+   "*Really like how it works. Extremely easy to use, straight forward, and as a job board being able to attach LinkedIn/CV/etc right on the job page is a what you want in something like this. Great job.*"  by Redditor FlatTextOnAScreen

First run
=======
Make sure you create the database first by running this command in the "Package manager console" window in Visual Studio
> update-database

UI
====

This job board wants to be like the Gmail app, responsive, fast and easy to use. 

[
![](https://angjobs.com/github-angjobs-printscreen3.jpg)
]
(http://AngJobs.com)

Mobile app
==
[
![](https://angjobs.com/angjobs-mobile-app.jpg)
]
(https://play.google.com/store/apps/details?id=com.AngJobs.app)


The code. Setup for devs
==
The single page app is based on [ng.Net.Template](https://visualstudiogallery.msdn.microsoft.com/48d928e3-9b5c-4faf-b46f-d6baa7d9886c) by Dahln Farnes 

On server side it uses .NET C# to provide the JSON endpoints(~/api/...) and Entity Framework Code First apropach for the data layer.
The single page app code(javascript+css) is located in ~/Assets/app

To run the web app on Windows you need [Visual Studio]( https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx)
and [Sql Server Express](https://www.microsoft.com/en-gb/server-cloud/products/sql-server-editions/sql-server-express.aspx) both are free tools by Microsoft 

*update*: this is the code style I might want to follow https://github.com/johnpapa/angular-styleguide#table-of-contents

Run tests
==
To run unit tests use this command at your command prompt:

AngJobs\AngJobs>**karma start test/karma.conf.js**

![](https://dl.dropboxusercontent.com/u/45940875/Angjobs/tests-karma-angjobs.jpg)

Todo
===
+  Create a recruiters page and list all 400+ recruiters from DB
+ Create a jobs applied for table
+  Create a responsive left side menu
+  Implement the "[digital roses](http://www.slate.com/articles/business/the_dismal_science/2012/02/internet_dating_how_digital_roses_can_make_it_a_better_experience_.html)" concept to job applications
   +  by default give 2 badgets per day for use to each candidate, max 10 badgets per week
   +  recruiters will be able to see whether the candidate used its badget in order to apply for a job
   +  why use badgets? it should help to select the right candidates more easily

+  Mark jobs posts as read, that can be done by removing the bold font
+  Mark the jobs applied for
+ Add  /feed.rss endpoint with latest jobs
+ Import more jobs from external providers/api
+  ~~Jobs detail page~~
+  ~~Upload resume functionality~~
+ ~~Import jobs from Hacker News this is the json~~ https://github.com/gaganpreet/hn-hiring-mapped/blob/gh-pages/src/web/data/2015-06.json
+  ~~Create an API page~~
+  ~~Add a Filters section on the side menu~~
+ Find and import some "remote jobs" providers from here https://github.com/lukasz-madon/awesome-remote-job
+ [Client side testing(unit test and e2e tests)](https://docs.angularjs.org/guide/unit-testing)
+ integrate the [Me-Api](https://github.com/danfang/me-api). Explore developers
+ ~~add angular-cache~~ 
+  
**Mobile app**
+ arrange/format content on job details screen

**Other tasks**
+ Setup a continuous delivery service - build server
+ When posting a job, after Remote/Contract/Permanent button click focus on the next textbox

Future plans
==
+  Apply for jobs while offline(on the train). Use service worker?
+  [Android app](https://play.google.com/store/apps/details?id=com.AngJobs.app) based on phonegap/ionic frameworks
+  Provide an Api. GET jobs, job applications. POST job, resume.

Frameworks used 
==

- Angular
- Web API
- Protractor for testing - end to end
- Ionic framework for mobile app, uses AngularJs

Contributors
==
+  Victor Antofica
+  
