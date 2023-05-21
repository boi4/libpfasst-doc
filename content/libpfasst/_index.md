+++
title = "LibPFASST"
+++
# LibPFASST

LibPFASST is a Fortran library that implements multiple Parallel-in-Time algorithms, including the ***P**arallel **F**ull **A**pproximation **S**cheme in **S**pace and **T**ime* (**PFASST**).

LibPFASST is open-source and hosted on [GitHub](https://github.com/libpfasst/LibPFASST).


## Dynamic MPI support

In the course of this IDP, LibPFASST was extended with an interface that allows it to dynamically grow and shrink by an arbitrary number of processes using the [dynamic Open MPI runtime](@/open-mpi/_index.md).
The source code of this modified version can be found on [GitHub](https://github.com/boi4/libpfasst).
It has the following new features and limitations:


<div class="alert alert-success position-static" role="alert">

#### Features:

* Dynamically growing and shrinking PFASST runs by an arbitrary number of processes. Note that the limitations of the runtime (resize granularity, universe size, ...) apply.
* Dynamically growing and shrinking space-parallel PFASST runs.
* New hooks for resize related events.<!-- TODO -->
* LibPFASST runs (also static ones) do not require anymore that the number of timesteps is a multiple of the size of the main communicator.

</div>



<div class="alert alert-warning position-static" role="alert">

#### Limitations:

* This version of LibPFASST was only tested with the PFASST algorithm running in block mode with `pf_pfasst_run`.
* It may be that other methods/features of LibPFASST were affected by changes made in this IDP and stopped working correctly. This is rather unlikely, but no guarantees can be given.
* It can only be linked against an MPI implementation that implements the dynamic Fortran MPI interface as defined at the bottom of [the Open MPI section](@/open-mpi/_index.md). This can be fixed however, by linking with a dummy library that provides routines with the same signatures.
* LibPFASST's interface and options for storing results might not work as expected. It is recommended to use LibPFASST hooks if logging of results is required.
* No resizing heuristics are implemented in LibPFASST itself. The application should must add these by setting TODO in the TODO hook.
* It needs rank-order preserving PSet operations to work properly with space-parallel runs (see below).

</div>


### PSet Ordering Assumption




## Usage

### Setup

This guide assumes that you have set up the dynprocs runtime as described in the beginning of the [Open MPI](@/open-mpi/_index.md) section.


### Using dynamic resources

Traditionally, a typical application using LibPFASST would look like this:


With the 



## Implementation Details

### PFASST block mode



<a href="#f90API" class="collapsed" data-bs-toggle="collapse" data-bs-target="#f90API" aria-expanded="false" aria-controls="f90API" style="text-decoration: none; color: black;">
<h3><span class="togglearrow" >▲</span>Dynamic LibPFASST API reference (click to expand)</h3>
</a>


<div id="f90API" class="collapse">
asdf
</div>
