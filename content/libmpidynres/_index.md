+++
title = "libmpidynres"
+++
## libmpidynres

**libmpidynres** is library that provides an emulation layer for dynamic resources in MPI based on `MPI_COMM_WORLD`.
It was implemented as a part of the bachelor thesis *A Simulation Layer for Dynamic Resources with MPI Sessions* (2020).
It is based on an early MPI Sessions API for dynamic resources which is documented extensively in section 5 of the thesis ([download](https://fecht.cc/public/ba.pdf)).
More information can also be found in *An Emulation Layer for Dynamic Resources with MPI Sessions* by Fecht et. al (2022).

The main idea of **libmpidynres** is (in C):
* the user includes both `mpi.h` and `mpidynres.h` header files
* **limpidynres** provides an MPI Sessions interface very similar to the interface that was released in MPI-4
* additionally, **libmpidyres** provides an interface to deal with changing number of resources (i.e. processes)
* the user only uses `MPI` communicators that are provided by `mpidynres.h` functions (`MPI_COMM_WORLD` is hidden from the user)
* **libmpidynres** starts and shuts down application processes using `MPI_COMM_WORLD`

The source code of *libmpidynres* can be found on [GitHub](https://github.com/boi4/libmpidynres/tree/fortran).

To compile **libmpidynres**, use:
```bash
git clone --branch fortran git@github.com:boi4/libmpidynres.git

# build libmpidynres
make -C libmpidynres
```

**Important Note: libmpidynres is not compatible with newer MPI implementations due to naming conflicts. If you use Open MPI, make sure to use Open MPI version v4.1.5 or below.**

When compiling **libmpidynres**, the mpi routines are linked together with the C routines into a single shared library at `libmpidynres/build/lib/libmpidynres.so`.
Additionally, four Fortran modules are built into `libmpidynres/build/include/` (`mpidynres.mod`, `mpidynres_f08.mod`, `mpidynres_sim.mod`, `mpidynres_f08.mod`).
These can be installed into the system by running `sudo make libmpidynres install`.


### Fortran Extension Documentation

To support Fortran applications like `LibPFASST`, **libmpidynres** was extended with a Fortran interface.

To use the **libmpidynres** in Fortran, an application wrapper must be created.
A typical application wrapper in *Fortran 2008* might look like this:

```f08
PROGRAM main
  use mpidynres_sim_f08
  use app
  implicit none

  type(MPIDYNRES_SIM_CONFIG) :: config
  integer :: ierror,world_size
  procedure(mpidynres_main_func), pointer :: main_func => app_main

  call MPI_INIT(ierror)
  config%base_communicator = MPI_COMM_WORLD
  call MPI_INFO_CREATE(config%manager_config, ierror)
  ! call MPI_INFO_SET(config%manager_config, "manager_initial_number_random", "yes")
  call MPI_COMM_SIZE(MPI_COMM_WORLD, world_size, ierror)
  call MPI_INFO_SET(config%manager_config, "manager_initial_number", itoa(world_size - 1), ierror)

  call MPIDYNRES_SIM_START(config, main_func)

  call MPI_INFO_FREE(config%manager_config, ierror)
  call MPI_FINALIZE(ierror)
END PROGRAM main
```

This assumes that the code that will be run by **libmpidynres** is contained in a module called `app` in a function called `app_main`.
Note that:
 * MPI needs to be initialized and finalized by the wrapper
 * to access the **libmpidynres** application wrapper functions, the module `mpidynres_sim_f08` is imported. For *Fortran 90*, the module is called `mpidynres_sim`
 * the communicator that is being used for the simulation is configured by setting the `base_communicator` field of the config

A fitting **mpidynres** application for the above wrapper might look like this:

```f08
MODULE app
use mpi_f08
use, intrinsic :: iso_c_binding

contains

subroutine app_main() bind(c)
  use mpidynres_f08
  implicit none
  ...
end subroutine app_main
```

Note that:
 * to access the **libmpidynres** application functions, the module `mpidynres_f08` is imported. For *Fortran 90*, the module is called `mpidynres`
 * the entry subroutine must be annotated using `bind(c)`

A complete example can be found in the `libmipdynres/examples` folder ([link f08](https://github.com/boi4/libmpidynres/blob/fortran/examples/0a_fortran_example.f08), [link f08](https://github.com/boi4/libmpidynres/blob/fortran/examples/0b_fortran_f08_example.f08)).

These examples can be compiled by running `make fortran_examples`.



### LibPFASST + libmpidynres

The initial adaptive LibPFASST implementation was based on *libmpidynres* and the API documented here.
That version of *LibPFASST* can be found on the branch `mpidynres` of the LibPFASST repository ([link](https://github.com/boi4/LibPFASST/tree/mpidynres)).
Note that, compared to the final Open MPI-based version, this version is not documented to the same amount here and also contains less features.
The instructions here are only mentioned for the sake of completeness.

To compile LibPFASST with mpidynres, you can run the following commands (in the parent directory of the **libmpidynres** source code):

```bash
git clone --branch mpidynres git@github.com:boi4/LibPFASST.git

cd LibPFASST

# make it work with newer gfortran versions
sed -i '/FFLAGS = -fallow-argument-mismatch/s/^.*$/FFLAGS += -fallow-argument-mismatch/g' Makefile.local

# compile
make DYNRES=TRUE MPIDYNRES_PATH=../libmpidynres
```

During the compilation of *LibPFASST*, the libmpidynres Fortran module files are included by passing them to the compilation commands. When using `LibPFASST`, the final executable must be dynamically linked against `libmpidynres.so`.

An example application is included in the `Tutorials/EX6_dynamic_mpi` directory.
To compile it use:
```bash
cd Tutorials/EX6_dynamic_mpi

# compile example
make MPIDYNRES_PATH=../../../libmpidynres
```

To run it on up to 7 processes (8 with the mpidynres resource manager) use:
```
LD_LIBRARY_PATH=../../../libmpidynres/build/lib mpirun -n 8 ./main.exe probin.nml
```

To get more debug output, the environment variable `MPIDYNRES_DEBUG` can be set to any value before running the program.


























---
<a href="#f90API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f90API" aria-expanded="false" aria-controls="f90API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>libmpidynres Fortran 90 API (click to expand)</h3>
</a>

<div id="f90API" class="collapse">
The following modules should be used by the user:

<br />
<br />

```f08
use, intrinsic :: iso_c_binding
use mpidynres
use mpidynres_sim
```

The `iso_c_binding` module is necessary for the `type(c_ptr)` type and for adding the `bind(c)` statement to the mpidynres entry function.

A designated *MPI_Session* type does not exists. Also, the `integer` type is not used for the session. Instead, the session argument of the API is of type `type(c_ptr)`.

The mpidynres config type is defined like this:
```f90
use mpi
type, bind(C) :: MPIDYNRES_SIM_CONFIG
  integer :: base_communicator
  integer :: manager_config
end type MPIDYNRES_SIM_CONFIG
```

Functions behave just like in the C version of *libmpidynres* and with the respective MPI Fortran 90 types (mostly `integer`). An additional, optional argument called `ierror` is added that contains the return value of the C function.


##### Application Constants

The following constants are contained in the `mpidynres` module:

```f08
! constants exported as symbols by libmpidynres.so
type(c_ptr), bind(C, name="MPI_SESSION_NULL") :: MPI_SESSION_NULL
integer(kind=C_INT), bind(C, name="MPIDYNRES_INVALID_SESSION_ID") :: MPIDYNRES_INVALID_SESSION_ID

! manually defined constants
integer :: MPI_MAX_PSET_NAME_LEN      = MPI_MAX_INFO_KEY + 1
integer :: MPIDYNRES_NO_ORIGIN_RC_TAG = -1

! enum MPIDYNRES_pset_op
integer :: MPIDYNRES_PSET_UNION      = 0
integer :: MPIDYNRES_PSET_INTERSECT  = 1
integer :: MPIDYNRES_PSET_DIFFERENCE = 2

! enum MPIDYNRES_RC_type
integer :: MPIDYNRES_RC_NONE = 0
integer :: MPIDYNRES_RC_ADD  = 1
integer :: MPIDYNRES_RC_SUB  = 2
```

##### Application Functions

The following subroutines are contained in the `mpidynres` module:

```f08
subroutine MPI_SESSION_INIT(info, errhandler, session, ierror)
  integer                       , intent(in)  :: info
  integer                       , intent(in)  :: errhandler
  type(c_ptr)                   , intent(out) :: session
  integer             , optional, intent(out) :: ierror
end subroutine MPI_SESSION_INIT
```

```f08
subroutine MPI_SESSION_FINALIZE(session, ierror)
  type(c_ptr)                   , intent(inout) :: session
  integer             , optional, intent(out)   :: ierror
end subroutine MPI_SESSION_FINALIZE
```

```f08
subroutine MPI_SESSION_GET_INFO(session, info_used, ierror)
  type(c_ptr)           , intent(in)  :: session
  integer               , intent(out) :: info_used
  integer     , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_INFO
```

```f08
subroutine MPI_SESSION_GET_PSETS(session, info, psets, ierror)
  type(c_ptr)           , intent(in)  :: session
  integer               , intent(in)  :: info
  integer               , intent(out) :: psets
  integer     , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_PSETS
```

```f08
subroutine MPI_SESSION_GET_PSET_INFO(session, pset_name, info, ierror)
  type(c_ptr)                , intent(in)  :: session
  character(len=*)           , intent(in)  :: pset_name
  integer                    , intent(out) :: info
  integer          , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_PSET_INFO
```

```f08
subroutine MPI_GROUP_FROM_SESSION_PSET(session, pset_name, newgroup, ierror)
  type(c_ptr)                , intent(in)  :: session
  character(len=*)           , intent(in)  :: pset_name
  integer                    , intent(out) :: newgroup
  integer          , optional, intent(out) :: ierror
end subroutine MPI_GROUP_FROM_SESSION_PSET
```

```f08
subroutine MPI_COMM_CREATE_FROM_GROUP(group, stringtag, info, errhandler, newcomm, ierror)
  integer                    , intent(in)  :: group
  character(len=*)           , intent(in)  :: stringtag
  integer                    , intent(in)  :: info
  integer                    , intent(in)  :: errhandler
  integer                    , intent(out) :: newcomm
  integer          , optional, intent(out) :: ierror
end subroutine MPI_COMM_CREATE_FROM_GROUP
```

```f08
subroutine MPIDYNRES_PSET_CREATE_OP(session, hints, pset1, pset2, op, pset_result, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(in)  :: hints
  character(len=*)            , intent(in)  :: pset1
  character(len=*)            , intent(in)  :: pset2
  integer(kind=c_int)         , intent(in)  :: op
  character(len=*)            , intent(out) :: pset_result
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_PSET_CREATE_OP
```

```f08
subroutine MPIDYNRES_PSET_FREE(session, pset_name, ierror)
  type(c_ptr)                 , intent(in)  :: session
  character(len=*)            , intent(in)  :: pset_name
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_PSET_FREE
```

```f08
subroutine MPIDYNRES_ADD_SCHEDULING_HINTS(session, hints, answer, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(in)  :: hints
  integer                     , intent(out) :: answer
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_ADD_SCHEDULING_HINTS
```

```f08
subroutine MPIDYNRES_RC_GET(session, rc_type, delta_pset, tag, info, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(out) :: rc_type
  character(len=*)            , intent(out) :: delta_pset
  integer                     , intent(out) :: tag
  integer                     , intent(out) :: info
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_RC_GET
```

```f08
subroutine MPIDYNRES_RC_ACCEPT(session, tag, info, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(in)  :: tag
  integer                     , intent(in)  :: info
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_RC_ACCEPT
```

```f08
subroutine MPIDYNRES_EXIT()
end subroutine MPIDYNRES_EXIT
```

##### Application Wrapper Functions

The following subroutines are contained in the `mpidynres_sim` module:

```f90
subroutine MPIDYNRES_SIM_GET_DEFAULT_CONFIG(o_config)
  type(MPIDYNRES_SIM_CONFIG), intent(out) :: o_config
end subroutine MPIDYNRES_SIM_GET_DEFAULT_CONFIG
```

```f90
subroutine MPIDYNRES_SIM_START(i_config, i_sim_main)
  type(MPIDYNRES_SIM_CONFIG), intent(in) :: i_config
  procedure(mpidynres_main_func)         :: i_sim_main
end subroutine MPIDYNRES_SIM_START
```


</div>

---


<a href="#f08API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f08API" aria-expanded="false" aria-controls="f08API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>libmpidynres Fortran 2008 API (click to expand)</h3>
</a>

<div id="f08API" class="collapse">

The following modules should be used by the user:
```f08
use, intrinsic :: iso_c_binding
use mpidynres_f08
use mpidynres_sim_f08
```

As in the Fortran 90 case, the `iso_c_binding` module is necessary for the `type(c_ptr)` type and for adding the `bind(c)` statement to the mpidynres entry function.

As in Fortran 90, the session argument of the API is of type `type(c_ptr)`.

The mpidynres config type is defined like this:
```f90
use mpi_f08

type, bind(C) :: MPIDYNRES_SIM_CONFIG
  type(MPI_Comm) :: base_communicator
  type(MPI_Info) :: manager_config
end type MPIDYNRES_SIM_CONFIG
```

Functions behave just like in the C version of *libmpidynres* and with the respective MPI Fortran 2008 types. An additional, optional argument called `ierror` is added that contains the return value of the C function.



##### Application Constants

The following constants are contained in the `mpidynres_f08` module:

```f08
! constants exported as symbols by libmpidynres.so
type(c_ptr), bind(C, name="MPI_SESSION_NULL") :: MPI_SESSION_NULL
integer(kind=C_INT), bind(C, name="MPIDYNRES_INVALID_SESSION_ID") :: MPIDYNRES_INVALID_SESSION_ID

! manually defined constants
integer :: MPI_MAX_PSET_NAME_LEN      = MPI_MAX_INFO_KEY + 1
integer :: MPIDYNRES_NO_ORIGIN_RC_TAG = -1

! enum MPIDYNRES_pset_op
integer :: MPIDYNRES_PSET_UNION      = 0
integer :: MPIDYNRES_PSET_INTERSECT  = 1
integer :: MPIDYNRES_PSET_DIFFERENCE = 2

! enum MPIDYNRES_RC_type
integer :: MPIDYNRES_RC_NONE = 0
integer :: MPIDYNRES_RC_ADD  = 1
integer :: MPIDYNRES_RC_SUB  = 2
```

Note that they are the same constants as in the Fortran 90 module.



##### Application Functions

The following constants are contained in the `mpidynres_f08` module:

```f08
subroutine MPI_SESSION_INIT(info, errhandler, session, ierror)
  type(MPI_Info)                , intent(in)  :: info
  type(MPI_Errhandler)          , intent(in)  :: errhandler
  type(c_ptr)                   , intent(out) :: session
  integer             , optional, intent(out) :: ierror
end subroutine MPI_SESSION_INIT
```

```f08
subroutine MPI_SESSION_FINALIZE(session, ierror)
  type(c_ptr)                   , intent(inout) :: session
  integer             , optional, intent(out)   :: ierror
end subroutine MPI_SESSION_FINALIZE
```

```f08
subroutine MPI_SESSION_GET_INFO(session, info_used, ierror)
  type(c_ptr)                   , intent(in)  :: session
  type(MPI_INFO)                , intent(out) :: info_used
  integer             , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_INFO
```

```f08
subroutine MPI_SESSION_GET_PSETS(session, info, psets, ierror)
  type(c_ptr)                   , intent(in)  :: session
  type(MPI_INFO)                , intent(in)  :: info
  type(MPI_INFO)                , intent(out) :: psets
  integer             , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_PSETS
```

```f08
subroutine MPI_SESSION_GET_PSET_INFO(session, pset_name, info, ierror)
  type(c_ptr)                 , intent(in)  :: session
  character(len=*)            , intent(in)  :: pset_name
  type(MPI_INFO)              , intent(out) :: info
  integer           , optional, intent(out) :: ierror
end subroutine MPI_SESSION_GET_PSET_INFO
```


```f08
subroutine MPI_GROUP_FROM_SESSION_PSET(session, pset_name, newgroup, ierror)
  type(c_ptr)                 , intent(in)  :: session
  character(len=*)            , intent(in)  :: pset_name
  type(MPI_Group)             , intent(out) :: newgroup
  integer           , optional, intent(out) :: ierror
end subroutine MPI_GROUP_FROM_SESSION_PSET
```

```f08
subroutine MPI_COMM_CREATE_FROM_GROUP(group, stringtag, info, errhandler, newcomm, ierror)
  type(MPI_Group)             , intent(in)  :: group
  character(len=*)            , intent(in)  :: stringtag
  type(MPI_Info)              , intent(in)  :: info
  type(MPI_Errhandler)        , intent(in)  :: errhandler
  type(MPI_Comm)              , intent(out) :: newcomm
  integer           , optional, intent(out) :: ierror
end subroutine MPI_COMM_CREATE_FROM_GROUP
```


```f08
subroutine MPIDYNRES_PSET_CREATE_OP(session, hints, pset1, pset2, op, pset_result, ierror)
  type(c_ptr)                 , intent(in)  :: session
  type(MPI_Info)              , intent(in)  :: hints
  character(len=*)            , intent(in)  :: pset1
  character(len=*)            , intent(in)  :: pset2
  integer(kind=c_int)         , intent(in)  :: op
  character(len=*)            , intent(out) :: pset_result
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_PSET_CREATE_OP
```


```f08
subroutine MPIDYNRES_PSET_FREE(session, pset_name, ierror)
  type(c_ptr)                 , intent(in)  :: session
  character(len=*)            , intent(in)  :: pset_name
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_PSET_FREE
```


```f08
subroutine MPIDYNRES_ADD_SCHEDULING_HINTS(session, hints, answer, ierror)
  type(c_ptr)                 , intent(in)  :: session
  type(MPI_Info)              , intent(in)  :: hints
  type(MPI_Info)              , intent(out) :: answer
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_ADD_SCHEDULING_HINTS
```


```f08
subroutine MPIDYNRES_RC_GET(session, rc_type, delta_pset, tag, info, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(out) :: rc_type
  character(len=*)            , intent(out) :: delta_pset
  integer                     , intent(out) :: tag
  type(MPI_Info)              , intent(out) :: info
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_RC_GET
```


```f08
subroutine MPIDYNRES_RC_ACCEPT(session, tag, info, ierror)
  type(c_ptr)                 , intent(in)  :: session
  integer                     , intent(in) :: tag
  type(MPI_Info)              , intent(in) :: info
  integer           , optional, intent(out) :: ierror
end subroutine MPIDYNRES_RC_ACCEPT
```


```f08
subroutine MPIDYNRES_EXIT()
end subroutine MPIDYNRES_EXIT
```

##### Application Wrapper Functions

The following subroutines are contained in the `mpidynres_sim_08` module:

```f08
subroutine MPIDYNRES_SIM_GET_DEFAULT_CONFIG(o_config)
  type(MPIDYNRES_SIM_CONFIG), intent(out) :: o_config
end subroutine MPIDYNRES_SIM_GET_DEFAULT_CONFIG
```

```f08
subroutine MPIDYNRES_SIM_START(i_config, i_sim_main)
  type(MPIDYNRES_SIM_CONFIG), intent(in) :: i_config
  procedure(mpidynres_main_func) :: i_sim_main
end subroutine MPIDYNRES_SIM_START
```

</div>

