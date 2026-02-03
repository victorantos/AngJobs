import { getDirname, path } from 'vuepress/utils'

const __dirname = getDirname(import.meta.url)

export default (options, context) => {
    return {
        name: 'vuepress-plugin-angjobs',
        clientConfigFile: path.resolve(__dirname, 'client.js'),
        onPrepared() {
          console.log('--- VuePress is ready!');
        },
        extendsMarkdown(md) {
        console.log('--- Plugin loaded with these options:', options);
      }
    }
  }