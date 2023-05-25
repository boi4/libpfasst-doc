+++
title = "LibPFASST"
+++
# LibPFASST

LibPFASST is a Fortran library that implements multiple Parallel-in-Time algorithms, including the ***P**arallel **F**ull **A**pproximation **S**cheme in **S**pace and **T**ime* (**PFASST**).

LibPFASST is open-source and hosted on [GitHub](https://github.com/libpfasst/LibPFASST).

In the course of this IDP, LibPFASST was extended with an interface that allows it to dynamically grow and shrink by an arbitrary number of processes using the [dynamic Open MPI runtime](@/open-mpi/_index.md).
The source code of this modified version can be found on [GitHub](https://github.com/boi4/libpfasst).
It has the following new features and limitations:


<div class="alert alert-success position-static" role="alert">

#### Features:

* Ability to dynamically grow and shrink PFASST runs by an arbitrary number of processes. Note that the limitations of the runtime (resize granularity, universe size, ...) apply.
* Ability to dynamically grow and shrink space-parallel PFASST runs.
* New hooks for resize related events.<!-- TODO -->
* LibPFASST runs (also static ones) do not require anymore that the number of timesteps is a multiple of the size of the main communicator.

</div>



<div class="alert alert-warning position-static" role="alert">

#### Limitations:

* This version of LibPFASST was only tested with the PFASST method ran with `pf_pfasst_run`. It also the only place where application resizing has been implemented.
* It may be that other methods/features of LibPFASST were affected by changes made in this IDP and stopped working as expected. This is rather unlikely, but no guarantees can be given.
* This version of LibFPASST can only be linked against an MPI library that implements the dynamic Fortran MPI interface as defined at the bottom of [the Open MPI section](@/open-mpi/_index.md). This can be fixed however, by linking with a dummy library that provides routines with the same signatures. Obviously, in that case, dynamic application resizing will not work.
* LibPFASST's interface and options for storing results might not work as expected. It is recommended to use LibPFASST hooks if logging of results is required.
* No resizing heuristics are implemented in LibPFASST itself. The application should add these by setting `pf%dynprocs%resize_delta` in the `PF_PRE_POT_RESIZE` hook.
* We assume that process set operation preserve the order of ranks in the arguments

</div>


## Introduction

LibPFASST is a Fortran implementation of the PFASST algorithm.

It provides some setup routines to the user and entry routines to start the algorithm.
It is written in a generic way and must be extended by the user to make it problem-specific.

To use LibPFASST, a user must:

* Implement a **data encapsulation class** or use one of the pre-defined LibPFASST classes
* Implement a **user level class**. This class defines how different levels in LibPFASST look like and how they interact with each other (interpolate/restrict).
* Implement a **sweeper class**. This class actually defines the specific differential equation that should be solved
* Implement a **main routine** that sets up and calls LibPFASST

Basically all examples in the official LibPFASST repo also implement a **probin module**, which loads general PFASST and problem specific parameters from a `probin.nml` file.



## Dynamic MPI support


Parallel-in-Time methods such as LibPFASST have some useful properties that make them a good fit for adaptive resources.

These properties include:

* **Orthogonality to space parallelization**: Parallel-in-Time methods can be combined with methods that parallelize in the space dimension (see [showcase](@/showcase/_index.md)).
The space parallelization is usually very loosely coupled to the time paralellization. Because of that, an application where it is difficult to adapt dynamically in space, can simply adapt in the time dimension only.
* **Low inter-block dependence**: Most of these methods work on a fixed set of timesteps which are dependent on the number of processors available. As a consequence, to solve more steps, they split up the total work into little blocks, which are worked on consecutively.
As these blocks are worked on step-by-step, this creates a good moment for resource resizing. Furthermore, the next block usually only depends on the solution of the previous block, so no complex data synchronzation is needed.
* **Lack of rebalancing need**: In a space parallel application, the domain is usually partitioned equally among all processors. Once there is a resize, the processors must repartition the space in a smart way and redistribute partial results. This can often become quite complex. In Parallel-in-Time applications however, this is not necessary, as the time domain is a single dimension that is worked on step by step.


These properties are the main motivation to apply dynamic resources to LibPFASST.
This project demonstates that with these types of libraries, little work is required to implement dynamic resources and it adds great power to the application.


### Rank Order Preservation Assumptions

TODO: nice images that explain stuff

* PSETOP_GROW must preserve rank order (this is actually true for all applications that do a broadcast from rank 0)
* PSETOP_SHRINK must preserve rank order
* PSETOP_UNION must preserve rank order
* PSETOP_DIFF must preserve rank order
* PSETOP_SPLIT must preserve rank order



## Build & Usage

### Compilation instructions

TODO: Add a note that this is automatically happening when running install_docker.sh

Before compiling LibPFASST, make sure that you have installed the dynamic Open MPI fork in one of the ways described in [the Open MPI section](@/open-mpi/_index.md) and `mpicc` and `mpifort` are both in your path.
You can double check by running `mpicc --showme` and `mpifort --showme` and validate that the right include and linking paths are shown.
Furthermore, you will need to have `make` installed.

In general, the compilation instructions for the version of LibPFASST are the same as for classic LibPFASST:

1. Clone the repository:
```bash
git clone https://github.com/boi4/LibPFASST.git
cd LibPFASST
```

2. When using newer versions of gfortran, add the following line to `Makefile.local` (make sure to use +=):

```bash
FFLAGS_EXTRA += -fallow-argument-mismatch
```

3. Compile LibPFASST:

```bash
make
```

This will create a file in `lib/libpfasst.a` and Fortran module files in `include/`.



### Using dynamic resources

Traditionally, a typical application using LibPFASST would look like this:
With the 

`pf%use_dynprocs`


### Controlling Dynamic Resources

Traditionally, a typical application using LibPFASST would look like this:
With the 



## Implementation Details


The main changes occured in the following source files:

| File             | Changes                                                                                                 |
|------------------|---------------------------------------------------------------------------------------------------------|
|`pf_dtype.f90`    | Introduction of new `pf_dynprocs_t` types and minor edits to `pf_pfasst_t`                              |
|`pf_dynprocs.f90` | New module containing user-facing routines and internal resize logic                                    |
|`pf_parallel.f90` | Modifications to `pf_pfasst_run` and `pf_block_run` to allow resizing and dynamic starts and shutdowns. |
|`pf_hooks.f90`    | Introduction of new hooks related to application resizing  TODO!!!!!!!!!                                |
|`pf_results.f90`  | Result arrays are have bigger allocation sizes as number of PFASST blocks is unknown a-priori           |



<!-- TODO: maybe draw a sequence diagram of both resource addition and resource removal -->


### PFASST block mode




### Resizing



### State Syncing

There are two types of states in LibPFASST:

1. **Static state**: This is the type of state that is alread determined when LibPFASST is entering the block mode.
For example, static state contains configuration parameters and local variables that are initialized deterministically.
Note that each new process will be spawned with the same command line, and thus with the same configuration options (given that the configuration files did not change on disk).
Static state does not need to be synchronized with new processes.

2. **Dynamic state**: This is the type of state that has been built up dynamically during the execution of the pfasst algorithm.
Dynamic state in LibPFASST includes partial results, progress variables (like the current time step and current time block) and other local variables that depend on the former.


Note that in LibPFASST, almost all of the state is contained within the `pf_pfasst_t` type (usually instantiated as a variable called `pf`).
There exists also a `pf_state_t` type which `pf_pfasst_t` holds an instance of, but it holds both static and dynamic state.
A big amount of state is also contained in the user levels.


**Implementation:**

As we are only considering resource addition at the beginning of a new block, we are only interested in the dynamic state required to join the run at that point.

In this implementation, the only dynamic state that is shared is the following:

* The base time step of the next block (= time step at rank 0)
* The number of the current block (note that this information is not strictly required for the algorithm, but can be useful for logging)
* The solution of the previous block (= the initial condition for this block)

Implicitly, the size of a block and the step to be worked on are contained in the size of the communicator and the rank of a process in this communicator.

This state sharing is implemented in the `pf_dynprocs_sync_state` routine in the `pf_dynprocs.f90` file using a broadcast from rank 0 over the `pf%comm%comm` communicator (which was derived from the main pset).
The routine assumes that both old and new processes are already merged into a single communicator stored in `pf%comm`.
Furthermore, it assumes that the process of rank 0 is one of the old communicators (see rank order preservation assumption above).


Note that in some rare use cases, state that would be typically categorized as static state like LibPFASST and application parameters
becomes dynamic. For example, when LibPFASST is used in a larger application which needs to solve some problems with dynamic properties.
Another example might be that we cannot ensure that configuration files stay the same on the disk, e.g., when doing runs lasting multiple hours or days.

In these cases more state needs to be synchronized.
To do this, the application must add a synchronization routine to either the `PF_PRE_SYNC` or the `PF_POST_SYNC` hook. <!-- TODO!!!!!!! -->
This hook should behave similarly to the `pf_dynprocs_sync_state` routine in the `pf_dynprocs.f90` file.



### The pf_dynprocs_t type


<a href="#f90API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f90API" aria-expanded="false" aria-controls="f90API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>Dynamic LibPFASST API reference (click to expand)</h3>
</a>


<div id="f90API" class="collapse">
asdf
</div>
