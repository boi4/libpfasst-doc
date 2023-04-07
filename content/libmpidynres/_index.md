+++
title = "libmpidynres"
+++
## libmpidynres

**libmpidynres** is library that provides an emulation layer for dynamic resources in MPI based on `MPI_COMM_WORLD`.
It was implemented in 2022 as a part of the bachelor thesis *A Simulation Layer for Dynamic Resources with MPI Sessions*.
It is based on an early MPI Sessions API for dynamic resources which is documented extensively in section 5 of the thesis ([download](https://fecht.cc/public/ba.pdf)).
More information can also be found in *An Emulation Layer for Dynamic Resources with MPI Sessions* by Fecht et. al (2022).

The main idea of **libmpidynres** is (in C):
* the user includes both `mpi.h` and `mpidynres.h` header files
* **limpidynres** provides an MPI Sessions interface very similar to the interface that was released in MPI-4
* additionally, **libmpidyres** provides an interface to deal with changing number of resources (i.e. processes)
* the user only uses `MPI` communicators that are provided by `mpidynres.h` functions (`MPI_COMM_WORLD` is hidden from the user)
* **libmpidynres** starts and shuts down application processes using `MPI_COMM_WORLD`


## Fortran extension

To support Fortran applications like `LibPFASST`, **libmpidynres** was extended with a Fortran interface.
The source code of this extension can be found [here](https://github.com/boi4/libmpidynres/tree/fortran).

To use the **libmpidynres** in Fortran, an application wrapper must be created.
A typical application wrapper might look like this:
This is an example using *Fortran 2008*:

```f90
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
```f90
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

A complete example can be found in the `/examples` folder ([link f90](https://github.com/boi4/libmpidynres/blob/fortran/examples/0a_fortran_example.f90), [link f08](https://github.com/boi4/libmpidynres/blob/fortran/examples/0b_fortran_f08_example.f90)).

These examples can be compiled by running `make fortran_examples` in the root of the repository.


## Fortran90 API


## Fortran08 API
