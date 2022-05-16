
# WIP

You can use `npm` during your tests, but you can't build the app with it. Instead, you will need to use `yarn` in order to flatten the dependencies before running the build.

- Clone the repo
- Run `yarn install` to fetch dependencies
- Run `yarn run nkmjs start-debug` to launch the Electron app in debug mode
    - Most of the app' code is under the `app/js` folder.
    - Use `Ctrl + R` to refresh the Electron debug container when you've made change to the source code.

- Run `yarn run nkmjs build` to build the app.
    - Builds will be added to the `builds/dekstop/{plateform}` folder, created during the process.


> Note : There is an issue on macOS with line-endings, looking into a fix 🪓
