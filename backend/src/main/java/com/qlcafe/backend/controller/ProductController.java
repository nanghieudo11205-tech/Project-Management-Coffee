package com.qlcafe.backend.controller;
import com.qlcafe.backend.dto.MessageResponse;
import com.qlcafe.backend.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    public ProductController(ProductService productService) {
        this.productService = productService;
    }
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'EMPLOYEE', 'STAFF')")
    public ResponseEntity<?> getProducts(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size,
                                         @RequestParam(required = false) String search,
                                         @RequestParam(required = false) Integer categoryId) {
        return ResponseEntity.ok(productService.getAllProducts(page, size, search, categoryId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<?> createProduct(@RequestParam("name") String name,
                                           @RequestParam("price") BigDecimal price,
                                           @RequestParam("categoryId") Integer categoryId,
                                           @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(productService.saveProduct(name, price, categoryId, file));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateProduct(@PathVariable Integer id,
                                           @RequestParam("name") String name,
                                           @RequestParam("price") BigDecimal price,
                                           @RequestParam("categoryId") Integer categoryId,
                                           @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(productService.updateProduct(id, name, price, categoryId, file));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<?> deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new MessageResponse("Deleted successfully"));
    }
}
