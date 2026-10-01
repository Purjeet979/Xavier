# Operating Systems Study Notes

## Chapter 1: Virtual Memory and Paging

Virtual memory is a memory management technique that provides an "idealized abstraction of the storage resources that are actually available on a given machine" which "creates the illusion to users of a very large (main) memory."

### Paging
Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. This scheme permits the physical address space of a process to be non-contiguous.
- **Pages**: Logical memory is divided into blocks of the same size called pages.
- **Frames**: Physical memory is divided into fixed-sized blocks called frames.
- **Page Table**: The page table data structure is used to map logical addresses to physical addresses. Each entry in the page table contains the frame number where the corresponding page is stored in physical memory.

The hardware implementation of the page table involves a Page Table Base Register (PTBR) which points to the page table, and a Page Table Length Register (PTLR) which indicates the size of the page table.

### Segmentation
Segmentation is another memory management scheme that supports the user view of memory. A logical address space is a collection of segments. Each segment has a name and a length.
- Unlike paging where the user is unaware of the fragmentation, in segmentation the user is aware of the segments.
- Segments are of variable size, whereas pages are of fixed size.
- A segment table maps two-dimensional user-defined addresses into one-dimensional physical addresses. Each entry has a segment base and a segment limit.

### Translation Lookaside Buffer (TLB)
The TLB is a dedicated, high-speed hardware cache used to reduce the time taken to access a user memory location. It stores the recent translations of virtual memory to physical memory and can be called an address-translation cache. If a page number is found in the TLB (TLB hit), the frame number is immediately available. If not (TLB miss), a page table walk is required.

## Chapter 2: Process Scheduling

Process scheduling is the activity of the process manager that handles the removal of the running process from the CPU and the selection of another process on the basis of a particular strategy.

### Scheduling Algorithms
1. **First-Come, First-Served (FCFS)**: The process that requests the CPU first is allocated the CPU first. It is implemented with a FIFO queue. Non-preemptive.
2. **Shortest-Job-Next (SJN)**: Also known as Shortest Job First. Associates with each process the length of its next CPU burst. When the CPU is available, it is assigned to the process that has the smallest next CPU burst.
3. **Round Robin (RR)**: Designed especially for time-sharing systems. Similar to FCFS, but preemption is added to switch between processes. A small unit of time, called a time quantum or time slice, is defined.

### Context Switch
A context switch is the process of storing the state of a process or thread, so that it can be restored and resume execution at a later point. This allows multiple processes to share a single CPU. Context switching is overhead; the system does no useful work while switching.
