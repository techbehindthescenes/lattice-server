App is built on appy

# ![alt tag](https://github.com/JKHeadley/appy/blob/master/assets/appy.png)

A user system leveraging [rest-hapi](https://github.com/JKHeadley/rest-hapi) to bootstrap your app.

appy is a boilerplate user system that leverages the powerful [rest-hapi](https://github.com/JKHeadley/rest-hapi) API generator.  Inspired by the [frame](https://github.com/jedireza/frame) user system, the goal of appy is to provide an easy to use user API that is also capable of supporting a wide range of applications.  appy is a great resource for starting almost any app.  Whether you're building a simple blogging site or a full blown enterprise solution, appy is the tool for you!  By leveraging [rest-hapi](https://github.com/JKHeadley/rest-hapi), adding new endpoints is as simple as defining a new model, and model associations are a snap.  Bootstrapping your app has never been easier!

## Features

* Registration and account activation flows
* Login system with forgot password and reset password
* Abusive login attempt detection
* User permissions based on roles and groups
* Three optional authentication strategies
* Endpoint validation and query support
* Swagger docs for easy endpoint access

## Technologies

appy implements a [hapi](https://github.com/hapijs/hapi) framework server.  appy's RESTful API endpoints are generated through [rest-hapi](https://github.com/JKHeadley/rest-hapi), which means models are based off of [mongoose](https://github.com/Automattic/mongoose) and data is stored in [MongoDB](www.mongodb.org).
