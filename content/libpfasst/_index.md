+++
title = "LibPFASST"
+++
# LibPFASST

LibPFASST is a Fortran library that implements multiple Parallel-in-Time algorithms, including the Parallel Full Approximation Scheme in Space and Time (PFASST).

LibPFASST is open-source and hosted on [GitHub](https://github.com/libpfasst/LibPFASST).


### Dynamic MPI support

In the course of this IDP, LibPFASST was extended with an interface that allows it to dynamically grow and shrink by an arbitrary number of processes using the [dynamic Open MPI runtime](http://torbus.lan:1111/open-mpi/).




### Features

* LibPFASST runs (also static ones) do not require anymore that the number of timesteps is a multiple of the size of the main communicator.

### Limitations

* This version of LibPFASST was only tested with the PFASST algorithm running in block mode (`pf_block_run`). It may be that other features of LibPFASST were affected by these changes and stopped working correctly. This is rather unlikely, but no guarantees can be given.
* It can only be linked against an MPI implementation that implements the dynamic Fortran MPI interface as defined at the bottom of the [Open MPI section](@/open-mpi/_index.md). This can be fixed however, by linking with a dummy library that provides the routine with the same signature. Such a library was not created in this IDP.
* LibPFASST's interface and options for storing results might not work as expected. It is recommended to use LibPFASST hooks if logging of results is required.


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
