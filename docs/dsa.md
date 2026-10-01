# Binary Search

Binary Search is a classic Divide and Conquer algorithm used to find the position of a target value within a sorted array.

## Implementation in Python

Here is a simple iterative implementation of Binary Search in Python:

```python
def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        # Check if target is present at mid
        if arr[mid] == target:
            return mid
            
        # If target is greater, ignore left half
        elif arr[mid] < target:
            left = mid + 1
            
        # If target is smaller, ignore right half
        else:
            right = mid - 1
            
    # Target is not present in the array
    return -1
```

## Time Complexity
The time complexity of binary search is O(log n), making it very efficient for large datasets compared to linear search which is O(n).
