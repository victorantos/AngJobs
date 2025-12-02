---
title: "The coding interview question involves a collection of points (places) on a 2D grid. Places and Queries against those places are listed in sequential order in a commands.txt file in a colon-seperated format. A query is a circle with a center point and radius, along with a collection of 0-N expected places contained within it."
author:
  name: place1asdf
  url: https://news.ycombinator.com/item?id=46112272
---
The coding interview question involves a collection of points (places) on a 2D grid. Places and Queries against those places are listed in sequential order in a commands.txt file in a colon-seperated format. A query is a circle with a center point and radius, along with a collection of 0-N expected places contained within it.

<pre><code>    Place - id, x, y
    Query - id, x, y, radius, expected return values (comma-separated)
</code></pre>
The task is to persist the places data in sequence and ensure queries return the set of expected places out of all places that have been seen so far. This is a basic geometry problem - if the euclidian distance (x^2 + y^2 = r^2) between any place and the circle&#x27;s center is less than the radius, the place is contained in the circle. You should anticipate thinking of ways to optimize once the dataset gets very big if you successfully complete the specific task within the allotted time.

<pre><code>    # commmands.txt example

    place-1:34.7:94.5
    place-2:54.1:5.2
    query-1:15.2:17.1:5.0:                  # no results expected
    place-3:44.9:27.4
    query-2:35.0:94.0:2.0:place-1           # one result expected
    ...
    query-100:50.0:30.0:place-27,place-64   # multiple results expected
    ...</code></pre>
<JobApplication />
