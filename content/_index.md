+++
title = "Dynamic LibPFASST"
+++
# Documentation for Dynamic LibPFASST

This page provides the documentation for my [interdisciplinary project](https://web.archive.org/web/20230520140608/https://www.cit.tum.de/en/cit/studies/degree-programs/master-informatics/interdisciplinary-project/) at the Technical University of Munich 2022-2023.

The goal of the project was to add dynamic MPI support to *LibPFASST*, a Fortran application that implements the PFASST method.

Many new software components were modified/created in the course of this project. You can use the links below or in the navigation bar to get to the documentation of the respective software component.

 - [Open MPI](@/open-mpi/_index.md): Patrick Huber's dynamic Open MPI fork was extended with a Fortran interface.
 - [LibPFASST](@/libpfasst/_index.md): MPI Sessions and resizing support was added to LibPFASST, a Fortran implementation of the PFASST algorithm.
 - [Showcase](@/showcase/_index.md): An example application running on dynamic LibPFASST was developed.
 - [Tools](@/tools/_index.md): Tools that help to debug and visualize applications using dynamic resources
 - [libmpidynres](@/libmpidynres/_index.md): A Fortran interface was added to libmpidynres, an emulation layer for MPI Sessions and process sets.

For questions about this project, feel free to [contact me](https://fecht.cc).<br/>
If you want to learn more about dynamic MPI or would like to contribute, please reach out to [Domink Huber](https://www.ce.cit.tum.de/caps/mitarbeiter/dominik-huber/) or [Prof. Martin Schreiber](https://www.martin-schreiber.info/).

The source code repository of this documentation [can be found on Github](https://github.com/boi4/libpfasst-doc).
It was written in May 2023.
