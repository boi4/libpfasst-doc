+++
title = "Open MPI"
+++
# Open MPI

A new API for dynamic resource management was introduced by Huber et al in *Towards Dynamic Resource Management with MPI Sessions and PMIx* (2022).
This API has been continously refined and is the basis for the final version of this project.

In the course of this IDP project, a fortran interface was added to version `v2a` of the Open MPI prototype introduced by Dominik Huber ([link](https://gitlab.inria.fr/dynres/dyn-procs/ompi/-/tree/fortran-support)).
For access, [please contact Dominik](https://www.ce.cit.tum.de/caps/mitarbeiter/dominik-huber/).


## Setup Instructions

It is advised to use the repository and follow the setup instructions described in the quickguide [here](https://gitlab.inria.fr/dynres/dyn-procs/docker-cluster) to setup a multi-container docker cluster.
Alternatively, you can also try to manually build the components: [prrte](https://gitlab.inria.fr/dynres/dyn-procs/prrte),
[openpmix](https://gitlab.inria.fr/dynres/dyn-procs/openpmix),
[ompi](https://gitlab.inria.fr/dynres/dyn-procs/ompi).

For development, it might help to enable debug symbols within Open MPI. To enable these, add the `--enable-debug` flag in the Open MPI configure command in `install_docker.sh`.



## Example Application


A proof of concept, loop-based MPI Fortran application is available for testing the API [here](https://gitlab.inria.fr/dynres/dyn-procs/test_applications/-/blob/fortran-support/examples/dyn_mpi_sessions_v2a.f90). It behaves similar to the C examples in the same project.

If you followed the quickguide linked above, the `test_applications` folder should already be avilable in your docker cluster.
Make sure that you have started the docker cluster and entered the environment using the `./mpiuser-drop-in.sh` script.

Then run the following commands:

```
cd /opt/hpc/build/test_applications

# build fortran example in release mode
scons example=DynMPISessions_v2a_fortran compileMode=release
```

The resulting binary is avilable at `build/DynMPISessions_v2a_fortran_release`.

The following flags are available:
```
Usage: ./build/DynMPISessions_v2a_fortran_release [-d] [-c <ITER_MAX>] [-l <proc_limit>] [-n <num_delta>] [-f <rc_frequency>] [-m <mode_string>]

Options:
  -d                  Enable debug prints
  -c <ITER_MAX>       Maximum number of iterations (default: 200)
  -l <proc_limit>     Maximum (or minimum in s_/b_ mode) number of processors (default: 64)
  -n <num_delta>      Number of delta values (default: 8)
  -f <rc_frequency>   Frequency of resource change steps (default: 10)
  -m <mode_string>    Mode (default: i+)
```

I recommend using `tmpi.py` (described in the [Tools section](@/tools/_index.md)) to run the examples with a nice visualization of the processes:

```
# download tmpi.py
wget https://raw.githubusercontent.com/boi4/tmpi-py/main/tmpi.py
chmod +x tmpi.py

# run fortran example with tmpi.py
MPIRUNARGS="--display map --mca btl_tcp_if_include eth0 --host n01:4,n02:4,n03:4,n04:4  -x LD_LIBRARY_PATH -x DYNMPI_BASE" \
        ./tmpi.py 16 \
        build/DynMPISessions_v2a_fortran_release -d -c 3000 -l 1 -m s_ -n 4 -f 200
```


## Implementation Details

To add a new Fortran function to Open MPI, the following steps can be used when in the root of the [Open MPI repository](https://github.com/open-mpi/ompi).
I am documenting this here, as I could not find this information easily online:

 1. Create a file in `ompi/ompi/mpi/fortran/mpif-h/` with the name of your function (check existing files to get the idea)
 2. Add this file to `ompi/ompi/fortran/mpif-h/Makefile.am`
 3. Create a symlink in `ompi/ompi/mpi/fortran/mpif-h/profile/` with "p" at start of filename: `ln -s ../../../../../ompi/mpi/fortran/mpif-h/${name} p${name}`
 4. Add this Symlink to `ompi/ompi/mpi/fortran/mpif-h/profile/Makefile.am`
 5. Add the Fortran interface to `ompi/ompi/fortran/use-mpi-ignore-tkr/mpi-ignore-tkr-interfaces.h.in`
 6. Add the Fortran interface to `ompi/ompi/fortran/use-mpi-tkr/mpi-f90-interfaces.h`
 7. Add a line to `ompi/ompi/fortran/mpif-h/prototypes_mpi.h`
 8. Add a line to `ompi/ompi/fortran/use-mpi-ignore-tkr/pmpi-ignore-tkr-interfaces.h`
 
The most important file is the one created in the first step.
It includes the C implementation of the Fortran call.
For this, the Fortran arguments are automatically translated into C arguments, as described [here](https://gcc.gnu.org/onlinedocs/gcc-9.4.0/gfortran/Argument-passing-conventions.html).

Importantly, each argument is passed as a single pointer type (even multi-dimensional arrays). For each string type argument, a hidden additional argument specifying the string's length is passed.

Open MPI offers multiple conversion functions which were used to implement the functions for this project.

Then, the internal Open MPI function is called with the converted arguments.
The "OUT" parameters of this call are converted back into fortran after the internal function returns.

---

<a href="#f90API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f90API" aria-expanded="false" aria-controls="f90API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>Fortran 90 v2a API (click to expand)</h3>
</a>


<div id="f90API" class="collapse">

asdf

</div>

```
