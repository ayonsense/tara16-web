# TARA16 Web

TARA16 Web is the browser-based frontend and emulator for **TARA16**
(Teaching Architecture for RISC Assembly), the 16-bit teaching processor used
in [CS2300: Foundations of Computer Systems Design](https://cse.iitm.ac.in/~ayon/courses/CS2300/CS2300.html)
at IIT Madras.

The application runs entirely in the browser. It provides an assembly editor,
assembler, CPU emulator, register and memory inspection, machine-code listing,
execution history, a 64 x 64 memory-mapped display, bundled examples, and
save/restore tools. There is no backend and no build step.

## Try it online

Open the hosted [TARA16 Web emulator](https://cse.iitm.ac.in/~ayon/courses/CS2300/taracpu/).

For C programs, use the
[TARA16 Web compiler](https://cse.iitm.ac.in/~ayon/courses/CS2300/taracpu/compiler/web),
which generates assembly that can be opened in the emulator.

## Run locally

```bash
git clone https://github.com/ayonsense/tara16-web.git
cd tara16-web
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a modern browser.
Any static web server or static-site host can serve the repository directly.

## Using the emulator

1. Select a bundled program or enter TARA16 assembly in the editor.
2. Choose **Load** to assemble it and initialize the machine.
3. Use **Step**, **Run**, **Back**, and **Reset** to control execution.
4. Inspect the registers, machine-code listing, memory map, display, and
   execution log.
5. Use **ISA** for the complete instruction reference.

Programs saved in the interface are stored in the browser's local storage.
Machine-state snapshots and memory data can also be imported or exported as
local files.

## Repository layout

```text
index.html          application shell and dialogs
style.css           responsive desktop and mobile interface
app.js              assembler, emulator, display, and UI logic
examples.js         bundled TARA16 assembly programs
assets/logo/        runtime branding used by the interface
.htaccess           Apache security and cache headers
_headers            equivalent headers for static hosting platforms
```

The frontend uses standard HTML, CSS, and JavaScript with no framework or
package-manager dependencies.

## Related resources

- [TARA Studio](https://github.com/ayonsense/tara16-studio) — installable
  desktop emulator, C compiler, examples, and FPGA interface.
- [TARA Studio manual](https://cse.iitm.ac.in/~ayon/courses/CS2300/taramanual/tarastudio/)
  — interface guide, architecture reference, examples, and debugging notes.
- [CS2300 course page](https://cse.iitm.ac.in/~ayon/courses/CS2300/CS2300.html)
  — course material and the broader TARA16 hardware/software context.
- [Ayon Chakraborty's homepage](https://cse.iitm.ac.in/~ayon/) — instructor
  and project information.

## Privacy

Assembly source, emulator state, and locally saved programs remain in the
browser; the application does not upload them to a server. The hosted page
includes Google Analytics for aggregate site-usage measurement.

## License

Copyright (C) Ayon Chakraborty, IIT Madras.

The source code is licensed under the GNU General Public License v3.0. See
[`LICENSE`](LICENSE) for the complete terms.
