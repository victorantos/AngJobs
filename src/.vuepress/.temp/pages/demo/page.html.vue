<template><div><p>Content before <code v-pre>more</code> comment is regarded as page excerpt.</p>
<!-- more -->
<h2 id="page-title" tabindex="-1"><a class="header-anchor" href="#page-title"><span>Page Title</span></a></h2>
<p>The first H1 title in Markdown will be regarded as page title.</p>
<p>You can also set title in Markdown's Frontmatter:</p>
<div class="language-md line-numbers-mode" data-highlighter="shiki" data-ext="md" data-title="md" style="--shiki-light:#24292e;--shiki-dark:#abb2bf;--shiki-light-bg:#fff;--shiki-dark-bg:#282c34"><pre v-pre class="shiki shiki-themes github-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#ABB2BF">---</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#E06C75">title</span><span style="--shiki-light:#24292E;--shiki-dark:#ABB2BF">: </span><span style="--shiki-light:#032F62;--shiki-dark:#98C379">Page Title</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#ABB2BF">---</span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="page-information" tabindex="-1"><a class="header-anchor" href="#page-information"><span>Page Information</span></a></h2>
<p>You can set page information in Markdown's Frontmatter.</p>
<ul>
<li>The author is Ms.Hope.</li>
<li>The writing date is January 1, 2020</li>
<li>Category is &quot;Guide&quot;</li>
<li>Tags are &quot;Page Config&quot; and &quot;Guide&quot;</li>
</ul>
<h2 id="page-content" tabindex="-1"><a class="header-anchor" href="#page-content"><span>Page Content</span></a></h2>
<p>You are free to write your Markdown here.</p>
<div class="hint-container tip">
<p class="hint-container-title">Assets</p>
<ul>
<li>You can place images besides your Markdown files nd use <strong>relative links</strong>.</li>
<li>For images in <code v-pre>.vuepress/public</code> directory, please use absolute links (i.e.: starting with <code v-pre>/</code>).</li>
</ul>
</div>
<h2 id="components" tabindex="-1"><a class="header-anchor" href="#components"><span>Components</span></a></h2>
<p>Each markdown page is converted into a Vue component, which means you can use Vue syntax in Markdown:</p>
<p>{{ 1 + 1 }}</p>
<!-- markdownlint-disable MD033 -->
<ul>
  <li v-for="i in 3">{{ i }}</li>
</ul>
<!-- markdownlint-enable MD033 -->
<p>You can also create and import your own components.</p>
<MyComponent /><hr>
<p>The theme contains some useful components. Here are some examples:</p>
<ul>
<li>
<p>A dark blue badge text badge at the end of line. <Badge text="Badge text" color="#242378" /></p>
</li>
<li>
<p>A card:</p>
<VPCard v-bind='{"title":"Mr.Hope","desc":"Where there is light, there is hope","logo":"https://mister-hope.com/logo.svg","link":"https://mister-hope.com","background":"rgba(253, 230, 138, 0.15)"}' /></li>
</ul>
</div></template>


<script setup>
import { defineComponent, h, ref } from 'vue';

const MyComponent = defineComponent({
  setup() {
    const input = ref('Hello world!');
    const onInput = (e) => {
      input.value = e.target.value;
    };

    return () => [
      h('p', [
        h('span','Input: '),
        h('input', {
          value: input.value,
          onInput,
        }),
      ]),
      h('p', [h('span','Output: '), input.value]),
    ];
  },
});
</script>