+++
title = "Showcase"
+++
# Showcase

To show that dynamic LibPFASST works in more complex settings, dynamic resources are applied to a 2D heat equation solver that works both parallely in time and parallely in space.

The original solver was part of the LibPFASST repository (`Examples/hypre`). This modified version is available separately on [Github](https://github.com/boi4/showcase_dyn_libpfasst).

The following video demonstrates how the heat equation is being solved and how process set operations are being used to dynamically grow and shrink the solver in the time dimension:

<div class="embed-responsive embed-responsive-16by9">
    <video class="embed-responsive" controls width="100%">
        <source src="./HeatEqu.mp4" type="video/mp4">
        Video Placeholder
    </video>
</div>
<figcaption class="figure-caption" style="text-align: center; margin-bottom: 2em; margin-top: 1em">
    Animated visualization of LibPFASST solving the 2D Heat Equation. Demonstrates how growing and shrinking works in "space-parallel mode".
</figcaption>


## Introduction

The heat equation is solved on a 2D square in the domain [0,π]x[0,π] with a zero boundary condition.
The initial condition is described by the function *u(x,y,0) =  sin(x) + sin(y)* which creates a "bump" on the square domain.
A closed form solution is given by *u(x,y,t) = exp(-2πt) (sin(x) + sin(y))*. This makes it possible to compute the error in the solution created by LibPFASST.

Additionally to parallelizing in time using LibPFASST, the domain is split up in a grid wise manner.
For example, the space domain can be split up into 4,9,16,... smaller squares.
This is implemented by running 4,9,16,... parallel PFASST instances where the sweeper will use communication across the space domain to compute the time derivatives.

In the non-dynamic case, this communication can be hidden transparently from LibPFASST.
The main routine creates a grid out of `MPI_COMM_WORLD` using `MPI_Comm_split` so that each process is part of exactly one time and one space communicator.
The time communicator is then used as the main LibPFASST communicator and the space communicator is used for solving the space component of the equation using the [HYPRE library](https://computing.llnl.gov/projects/hypre-scalable-linear-solvers-multigrid-methods).


## Splitting mpi://WORLD into a process set grid

Because resize operations work on process sets, we cannot rely on `MPI_Comm_split` but instead need to split up the process sets directly.

This is done in the following fashion (implemented in `create_pset_grid` in `src/comm.f90`):

1. Split up "mpi://WORLD" into space process sets: space_psets = **SPLIT(** "mpi://WORLD", "ntime,ntime,...,ntime" (nspace repetitions) **)**
2. Split up each space process set into single-process process sets: space_time_psets = **SPLIT(** space_pset[i], "1,1,...,1" (ntime repetitions) **)**, for i = 1,...,nspace
3. Create time process sets by merging the right sing-process process sets: time_psets[i] = **UNION(** space\_time\_pset[i], space\_time\_psets[nspace+i], ..., space\_time\_psets[(ntime-1)nspace + i **)**, for i = 1,...,ntime

Here we need the order preservation assumption for creating an consistent grid (the indexing in the third step must work).


## Space-parallel mode in LibPFASST

Because process set operations need global coordination, the fact that multiple PFASST instances are running in parallel cannot be transparently hidden from dynamic LibPFASST.

Instead, LibPFASST requires additional information to be able to resize correctly.
This way of running LibPFASST is called "space-parallel mode".

It can be enabled by passing additional `global_pset` and `horizontal_pset` to the `pf_dynprocs_create` routine.
This will set the respective attributes of `pf%dynprocs` and create the respecive communicators.

Furthermore, the resize operations become more complex. The logic is implemented in the following subroutines: `pf_dynprocs_create_comm` (for joining an existing run), `pf_dynprocs_handle_growth_global` (for shrinking by a number of time steps) and `pf_dynprocs_handle_shrink_global` (for growing by a number of time steps and establish communication with new processes).
Again, we need the order preservation assumption for this to work and to keep grid consistency.
These implement resizing in the following fashion (see also the video at the top):

**Grow:**
   1. Create a `PSETOP_GROW` request with `ntime * num_new_timesteps` as the requested size.
   2. Wait for new global process set and delta process set to be returned by `MPI_Sessions_dyn_v2a_query_psetop`.
   3. Include the global process set name in the dict of the delta process set and finalize the process set operation.
   4. New processes: Create a process set grid from their "mpi://WORLD" (delta pset for the old processes)
   5. All processes: Create communicator from new global process set
   6. Rank 0 of each time process set of old and new processes: Send time process set name and space process set rank to global_rank 0.
   7. Rank 0 global communicator: Receive process set names for each space partition. Create unions from old and new time process sets and use the space rank for matching (so all processes in a time process set work on the same space domain). Send union process set names back to the respective processes.
   8. Rank 0 of each time process set of old and new processes: Broadcast new time process set name across time communicator
   9. All processes: Make new time process set the main process set of the LibPFASST run

**Shrink:**
   1. Create a new delta process set with a `PSETOP_UNION` operation across the last `num_timesteps_to_remove` space process sets
   2. Create `nspace` `PSETOP_DIFF` operations for each time process set to get the new time process sets
   3. Create a `PSETOP_SHRINK` request with `ntime * num_timesteps_to_remove` as the requested size. Pass the delta process set as an argument, so the runtime only removes these processes.
   4. Wait for new global process set and delta process set to be returned by `MPI_Sessions_dyn_v2a_query_psetop`.
   5. If a process needs to shut down, exit the LibPFASST block loop



## Compilation instructions

*Note: If you have followed the instructions for the Docker build in the [Open MPI section](@/open-mpi/_index.md), the showcase was already cloned and compiled at `/opt/hpc/build/showcase_dyn_libpfasst`.*

To compile this program, make sure that you have built the dynamic version of LibPFASST that can be found [here](https://github.com/boi4/libpfasst).

Furthermore, you will need to build hypre:

```
git clone https://github.com/hypre-space/hypre.git
cd hypre/src
./configure --disable-fortran
make -j
cd ../..
```

Then run the following commands:

```
# clone the repository
git clone https://github.com/boi4/showcase_dyn_libpfasst.git && cd showcase_dyn_libpfasst

# clone hypre
git clone git clone https://github.com/hypre-space/hypre.git

# build hypre
cd hypre/src && ./configure --disable-fortran && make -j && cd ../..

# finally, compile this project
make LIBPFASST=/path/to/LibPFASST/
```


## Usage

Please refer to the LibPFASST documentation to see what parameters you can set in probin.nml.

The following additional parameters can control the run:
```
dump_values <- logical, whether to dump solution values after each block
dump_dir    <- string, where to dump the values to
nspace      <- integer, number of processes per time step, must be a square number
T0          <- float, t0
TFin        <- float, tfin
nsteps      <- integer, number of timesteps
```

Note that when nsteps/(TFin-T0) goes below some threshold (seems to be around ~1), the algorithm will become numerically unstable and a division by zero may appear.

You can run the solver with the following command:

```
mpirun <YOUR MPI RUN ARGUMENTS HERE> ./main.exe probin.nml
```

Because of the resize granularity restriction of the runtime, make sure to have the number of processes per node be equal to the number of processes per time step (`nspace`).

If you followed the Docker setup as described in the [Open MPI section](@/open-mpi/_index.md), you can pass the following arguments to mpirun (for nspace=4):

```
mpirun --mca btl_tcp_if_include eth0 --host n01:4,n02:4,n03:4,n04:4,n05:4,n06:4,n07:4,n08:4 -np 16 ./main.exe probin.nml
```
