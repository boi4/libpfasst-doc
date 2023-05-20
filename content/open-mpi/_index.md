+++
title = "Open MPI"
+++
# Open MPI

Open MPI is a free and open-source implemention of the MPI standard.
For the development of dynamic LibPFASST, an Open MPI fork was used to implement the new process set API (see below).


## Contributions to Upstream

MPI Sessions support, especially in Fortran, is still lacking in the offical Open MPI repos (as of early 2023).
In this project, two pull requests were created and merged to the upstream Open MPI repository:

* [ompi/pull/11496](https://github.com/open-mpi/ompi/pull/11496): *Add MPI_SESSION_NULL to fortran* - make the constant `MPI_SESSION_NULL` available in Fortran programs
* [ompi/pull/11487](https://github.com/open-mpi/ompi/pull/11487): *Fix wrong buffer size in ompi_session_get_nth_pset_f* - fix a buffer overflow in one of the Fortran MPI Sessions calls



## Dynamic MPI Fork

A new API for dynamic resource management was introduced by Huber et al in *Towards Dynamic Resource Management with MPI Sessions and PMIx* (2022).
This API has been continously refined and is the basis for the final version of this project.

In the course of this IDP, a Fortran interface was derived for version `v2a` of the Open MPI prototype introduced by Dominik Huber ([link](https://gitlab.inria.fr/dynres/dyn-procs/ompi/-/tree/fortran-support)).
For access, [please contact Dominik](https://www.ce.cit.tum.de/caps/mitarbeiter/dominik-huber/).

The interface is specified in Fortran 90, as this is the MPI version that LibPFASST uses.
However, little work is required to add Fortran 08 support.

Also, the non-blocking variants of the MPI Sessions API (`MPI_Session_dyn_v2a_psetop_nb`, `MPI_Session_dyn_v2a_query_psetop_nb`, `MPI_Session_get_pset_data_nb`) could not be implemented in Fortran, due to required conversion of the results of these calls.


<div class="alert alert-warning" role="alert">
  Warning: Due to the representation of strings in Fortran, spaces are disallowed in process set names.
</div>


### Setup instructions for local machine

It is advised to use the repository and follow the setup instructions described in the quickguide [here](https://gitlab.inria.fr/dynres/dyn-procs/docker-cluster) to setup a multi-container docker cluster on your computer.
Alternatively, you can also try to manually build the components: [prrte](https://gitlab.inria.fr/dynres/dyn-procs/prrte),
[openpmix](https://gitlab.inria.fr/dynres/dyn-procs/openpmix),
[ompi](https://gitlab.inria.fr/dynres/dyn-procs/ompi).

For development, it might help to enable debug symbols within Open MPI. To enable these, add the `--enable-debug` flag in the Open MPI configure command in `install_docker.sh`.



### Setup instructions for running on the LRZ Linux Cluster

Based on the information provided here: [https://doku.lrz.de/display/PUBLIC/Building+software+in+user+space+with+spack](https://doku.lrz.de/display/PUBLIC/Building+software+in+user+space+with+spack)

1. Download the spack packages for the Open MPI fork: <span style="font-size: 13px">[spack_packages.zip (44Kb)](./spack_packages.zip ())</span>
2. Copy the zip file into the home directory in your LRZ login node and unzip it there :
```bash
unzip spack_packages.zip
```
3. Load spack user utilities:
```bash
module load user_spack
```
4. Create your own spack reop:
```
mkdir -p ~/spack_repos
spack repo create ~/spack/repos/mine
```
5. Move packages into your repo:
```
mv packages ~/spack/repos/mine/
```
6. Install the packages:
```
spack install dyn_ompi
```

From then on, to activate the environment when logging in, run:

```
module load user_spack
spack load dyn_ompi
```

To run an MPI application with the fork, it is currently best to allocate an interactive session:

1. Allocate session (replace `NNODES` with the number of nodes you want to allocate):
```bash
salloc --nodes NNODES ...
```
2. Run your application (replace `PROCS_PER_NODE` with the number of processors available on each node, which is also the granularity of the addition/removal of resources):
```
mpirun --host $(scontrol show hostname $SLURM_NODELIST | sed 's/$/:'PROCS_PER_NODE'/g'  | tr '\n' ',') <further mpi run arguments> ...
```





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

For a list of code changes, check out the [commit history on GitLab](https://gitlab.inria.fr/dynres/dyn-procs/ompi/-/commits/fortran-support).

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

After the conversion of the input arguments, the internal Open MPI function is called with the converted arguments.
The "OUT" parameters of this call are converted back into fortran after the internal function returns.

---

<a href="#f90API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f90API" aria-expanded="false" aria-controls="f90API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>Fortran 90 v2a API (click to expand)</h3>
</a>


<div id="f90API" class="collapse">


##### Constants

The following new constants are available in the `mpi` module:

```f08
integer MPI_PSETOP_NULL
integer MPI_PSETOP_ADD
integer MPI_PSETOP_SUB
integer MPI_PSETOP_REPLACE
integer MPI_PSETOP_MALLEABLE
integer MPI_PSETOP_GROW
integer MPI_PSETOP_SHRINK
integer MPI_PSETOP_UNION
integer MPI_PSETOP_DIFFERENCE
integer MPI_PSETOP_INTERSECTION
integer MPI_PSETOP_SPLIT
```

These constants are used for the `op` and `type` arguments in `MPI_Session_dyn_v2a_psetop` and `MPI_Session_dyn_v2a_query_psetop` and represent the respective pset operation.

Note that `MPI_PSETOP_SHRINK`, `MPI_PSETOP_GROW`, `MPI_PSETOP_ADD` and `MPI_PSETOP_SUB` modify the available resources of the application.
The other pset operations only recombine existing process sets.


##### Subroutines


Analogously to existing Fortran subroutines in the MPI standard, the corresponding Fortran routines have the same name and arguments as their C counterpart.
Additionally, an optional `integer ierror` argument can be added at the end of each call to get the return status of the operation.

The exception is the `output_psets` argument of `MPI_Session_dyn_v2a_psetop` and `MPI_Session_dyn_v2a_query_psetop`.
Instead of being allocated by the Open MPI runtime, it requires the user to pre-allocate these.

String arguments that contain a process set name and are of type `IN` or `INOUT` should be able to hold at least `MPI_MAX_PSET_NAME_LEN` arguments (constant is available in the `mpi` module).
Furthermore, process set names are terminated by filling the rest of the string with blanks (`' '`, ASCII 0x20).



---



**PSet Data Routines**

```f90
interface
subroutine MPI_Session_get_pset_data(session, pset_name , coll_pset_name, keys, nkeys, wait, info_used, ierror)
  implicit none
  integer,                        intent(in)  :: session
  character(len=*),               intent(in)  :: coll_pset_name
  character(len=*),               intent(in)  :: pset_name
  character(len=*), dimension(*), intent(in)  :: keys
  integer,                        intent(in)  :: nkeys
  integer,                        intent(in)  :: wait
  integer,                        intent(out) :: info_used
  integer,                        intent(out) :: ierror
end subroutine MPI_Session_get_pset_data
end interface
```

* Works analogously to the C version.

From [C documentation](https://gitlab.inria.fr/dynres/dyn-procs/ompi/#process-set-dictionaries):

```
RETURN: 
   - MPI_SUCCESS if operation was successful

Description:   Publishes a key-value pair in the dictionary associated with the given PSet name.
               The PSet name has to exist.
```


---


```f90
interface
subroutine MPI_Session_set_pset_data (session, pset_name, info_used, ierror)
  implicit none
  integer,          intent(in)  :: session
  character(len=*), intent(in)  :: pset_name
  integer,          intent(in)  :: info_used
  integer,          intent(out) :: ierror
end subroutine MPI_Session_set_pset_data
end interface
```

* Works analogously to the C version.

From [C documentation](https://gitlab.inria.fr/dynres/dyn-procs/ompi/#process-set-dictionaries):

```
RETURN: 
   - MPI_SUCCESS if operation was successful
Description:   Looks up a key-value pair in the dictionary associated with the given PSet name.
               The PSet name has to exist.
               The call is collective over the processes in coll_pset_name, i.e. all processes in 
               coll_pset_name have to call this function. All processes are guaranteed to receive the
               same values. mpi://SELF may be used for individual lookups
```




---




**PSet Operation Routines**

```f90
interface
subroutine MPI_Session_dyn_v2a_query_psetop (session, coll_pset, input_pset, type, output_psets, noutput, ierror)
  integer,                        intent(in)    :: session
  character(len=*),               intent(in)    :: coll_pset
  character(len=*),               intent(in)    :: input_pset
  integer,                        intent(out)   :: type
  character(len=*), dimension(*), intent(out)   :: output_psets
  integer,                        intent(inout) :: noutput
  integer,                        intent(out)   :: ierror
end subroutine MPI_Session_dyn_v2a_query_psetop
end interface
```


* `output_psets` must be pre-allocated by the caller.
* `noutput` needs to be set to the number of entries in `output_psets`.
* On sucessful return and `type != MPI_PSETOP_NULL`, `noutput` will be set to the number of output psets and the names of the output psets will be located in `noutputs`.

From [C documentation](https://gitlab.inria.fr/dynres/dyn-procs/ompi/#set-operations):

```
RETURN: 
   - MPI_SUCCESS if operation was successful

Description:   Queries for pending PSet Operation invloving the specified PSet.
               This only applies to PSet operations involving changes of resources:
                  -> MPI_PSETOP_{ADD, SUB; GROW, SHRINK, REPLACE}
               If no pending PSet operation is found for the specified PSet, op will be set to MPI_PSETOP_NULL
```


---


```f90
interface
subroutine MPI_Session_dyn_v2a_psetop (session, op, input_sets, ninput, output_psets, noutput, info, ierror)
   integer,                        intent(in)    :: session
   integer,                        intent(inout) :: op
   character(len=*), dimension(*), intent(in)    :: input_sets
   integer,                        intent(in)    :: ninput
   character(len=*), dimension(*), intent(inout) :: output_psets
   integer,                        intent(inout) :: noutput
   integer,                        intent(inout) :: info
   integer,                        intent(out)   :: ierror
end subroutine MPI_Session_dyn_v2a_psetop
end interface
```


* `output_psets` must be pre-allocated by the caller.
* `noutput` needs to be set to the number of entries in `output_psets`.
* On sucessful return `noutput` will be set to the number of output psets and the names of the output psets will be located in `noutputs`.

From [C documentation](https://gitlab.inria.fr/dynres/dyn-procs/ompi/#set-operations):

```
RETURN: 
   - MPI_SUCCESS if operation was successful

Description:   Requests the specified PSet Operation to be applied on the input PSets.
               The info object can be used to specify parameters of the operation.
               If successful, the function allocates an array of n_output PSet names.
               It is the callers responsibility to free the PSet names and the output_psets array.
```



---



```f90
interface
subroutine MPI_Session_dyn_finalize_psetop(session, pset_name, ierror)
  implicit none
  integer,          intent(in)  :: session
  character(len=*), intent(in)  :: pset_name
  integer,          intent(out) :: ierror
end subroutine MPI_Session_dyn_finalize_psetop
end interface
```

* Works analogously to the C version.

From [C documentation](https://gitlab.inria.fr/dynres/dyn-procs/ompi/#set-operations):

```
RETURN: 
   - MPI_SUCCESS if operation was successful

Description:   Indicates finalization of the PSet Operation.
               This will make the operation unavailable for MPI_Session_dyn_v2a_query_psetop.
               This only applies to PSet operations involving changes of resources:
                  -> MPI_PSETOP_{ADD, SUB; GROW, SHRINK, REPLACE}
```

</div>
