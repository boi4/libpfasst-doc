+++
title = "Tools"
+++
# Tools


Debugging parallel programs is hard. Especially MPI programs.

Debugging adaptive programs is even harder. That is why I created multiple tools to facilitate the development and debugging of dynamic applications.

## tmpi.py

`tmpi.py` is a tool that facilitates the development and debugging of adaptive MPI applications.

Its source code is available on Github: [https://github.com/boi4/tmpi-py](https://github.com/boi4/tmpi-py)

It allows you to interact with each process of an MPI run in a different tmux (a terminal multiplexer) pane.
This is very useful in terminal-only environments (ssh/docker/...) where typical tricks like starting multiple instances of a terminal emulator do not work.

It is is a python rewrite of [tmpi](https://github.com/Azrael3000/tmpi) with the following benefits:

* Support for dynamic resizing of MPI jobs
* Faster startup
* Support mpirun with multiple hosts (with `MPIRUNARGS="--host ..." ./tmpi.py ...`)
* mpi rank and host are shown in the upper frame of each pane
* No need to quote + escape mpi command

It has the following disadvantages:

* you can run only one instance of `tmpi.py` on a single host
* if you have mpi processes on other hosts, you need to be able to ssh into them
* `tmpi.py` opens a port for remote mpi processes to register themselves. This might be a security issue.


### Adaptive Applications

When running applications using [dynamic Open MPI](@/open-mpi/_index.md), `tmpi.py` will respond to resource changes in the following fashion:

* **Resource addition**: For each new process, a new tmux pane is created and the stdin/stdout of the process is connected to the pane.
* **Resource removal**: If `TMPI_REMAIN=true`, the panes of stopped processes remains (useful for post-mortem debugging). Otherwise, the pane will be removed together with the process.

### Dependencies (installed on each MPI host)
- [tmux](https://github.com/tmux/tmux/wiki)
- [Reptyr](https://github.com/nelhage/reptyr)
- Python 3.7 or later

### Further requirements
- If you run mpi processes on remote hosts, you need to be able to ssh into them with the user that started `tmpi.py` without any password prompt

### Installation
Just copy the `tmpi.py` script somewhere in your `PATH`.
If you run MPI on multiple hosts, the `tmpi.py` script must be available at the same location on each host.

### Example usage

Parallel debugging with GDB:
```
tmpi.py 4 gdb executable
```

It is advisable to run gdb with a script (e.g. `script.gdb`) so you can use
```
tmpi.py 4 gdb -x script.gdb executable
```

If you have a lot of processors you want to have `set pagination off` and add the `-q` argument to gdb:
```
tmpi.py 4 gdb -q -x script.gdb executable
```
This avoids pagination and the output of the copyright of gdb, which can be a nuissance when you have very small tmux panes.

### Full usage

`./tmpi.py [number of initial processes] COMMAND ARG1 ...`

You need to pass at least two arguments.
The first argument is the number of processes to use, every argument after that is the commandline to run.

If the environement variable `TMPI_REMAIN=true`, the new window is set to remain on exit and has to be closed manually. ("C-b + &" by default)

You can pass additional 'mpirun' argument via the `MPIRUNARGS`` environment variable

You can use the environment variable `TMPI_TMUX_OPTIONS` to pass options to the `tmux` invocation,
  such as `TMPI_TMUX_OPTIONS='-f ~/.tmux.conf.tmpi'` to use a special tmux configuration for tmpi.

Little usage hint: By default the panes in the window are synchronized. If you wish to work only with one thread maximize this pane ("C-b + z" by default) and work away on one thread. Return to all thread using the same shortcut.


### Keybindings

In general, the keybindings from [tmux](https://github.com/tmux/tmux/wiki) apply. The most useful ones are the following:

* `Ctrl-b + &` - Kill current window (="tab")
* `Ctrl-b + n` - Go to next window (="tab")
* `Ctrl-b + p` - Go to previous window (="tab")
* `Ctrl-b + z` - Maximize/Minimize currently selected pane. Useful for debugging a single process.
* `Ctrl-b + <arrow key>` - Select pane left/right/above/below currently selected pane.


### Screenshots


<br/>
<a href="./tmpi_debug_example.png" target="_blank">
<img class="img-fluid rounded mx-auto" src="./tmpi_debug_example.png">
</a>
<figcaption class="figure-caption" style="text-align: center; margin-bottom: 2em; margin-top: 1em">
    tmpi.py showing 16 running gdb MPI processes.
</figcaption>

<div class="embed-responsive embed-responsive-16by9">
    <video class="embed-responsive" controls width="100%">
        <source src="./tmpi_add_sub_example.mp4" type="video/mp4">
        Video Placeholder
    </video>
</div>
<figcaption class="figure-caption" style="text-align: center; margin-bottom: 2em; margin-top: 1em">
    tmpi.py running an application that grows and shrinks dynamically on up to 4 hosts.
</figcaption>
