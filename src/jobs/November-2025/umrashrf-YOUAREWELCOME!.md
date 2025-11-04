---
title: "YOU ARE WELCOME !"
author:
  name: umrashrf
  url: https://news.ycombinator.com/item?id=45807375
---
YOU ARE WELCOME !

<pre><code>  curl -s &quot;https:&#x2F;&#x2F;news.ycombinator.com&#x2F;item?id=45800465&quot; - python3 -c &quot;
        import sys, re
        text = sys.stdin.read()

        # Find normal and obfuscated email patterns
        emails = re.findall(r&#x27;[A-Za-z0-9._%+-]+\s*(?:@-\[at\]-\(at\))\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}&#x27;, text, flags=re.I)

        # Clean and normalize
        cleaned = [re.sub(r&#x27;\s*(?:\[at\]-\(at\))\s*&#x27;, &#x27;@&#x27;, e).strip() for e in emails]

        # Print unique, sorted list
        for e in sorted(set(cleaned)):
            print(e)
        &quot;</code></pre>
<JobApplication />
