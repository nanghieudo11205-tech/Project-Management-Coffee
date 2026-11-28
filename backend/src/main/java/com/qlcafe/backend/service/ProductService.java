package com.qlcafe.backend.service;

import com.qlcafe.backend.entity.Category;
import com.qlcafe.backend.entity.Product;
import com.qlcafe.backend.exception.BusinessException;
import com.qlcafe.backend.exception.ResourceNotFoundException;
import com.qlcafe.backend.repository.CategoryRepository;
import com.qlcafe.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            FileStorageService fileStorageService
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.fileStorageService = fileStorageService;
    }

    public Page<Product> getAllProducts(int page, int size, String search, Integer categoryId) {
        String trimmedSearch = search != null ? search.trim() : "";
        boolean hasSearch = !trimmedSearch.isEmpty();
        boolean hasCategory = categoryId != null;

        PageRequest pageable = PageRequest.of(page, size);
        if (hasSearch && hasCategory) {
            return productRepository.findByNameContainingIgnoreCaseAndCategoryIdAndIsAvailableTrue(
                    trimmedSearch, categoryId, pageable);
        }
        if (hasCategory) {
            return productRepository.findByCategoryIdAndIsAvailableTrue(categoryId, pageable);
        }
        if (hasSearch) {
            return productRepository.findByNameContainingIgnoreCaseAndIsAvailableTrue(trimmedSearch, pageable);
        }
        return productRepository.findByIsAvailableTrue(pageable);
    }

    public Product saveProduct(String name, BigDecimal price, Integer categoryId, MultipartFile file) {
        validateProductInputs(name, price);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục sản phẩm"));
        Product product = new Product();
        product.setName(name.trim());
        product.setPrice(price);
        product.setCategory(category);
        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            product.setImageUrl(fileName);
        }
        return productRepository.save(product);
    }

    public Product updateProduct(Integer id, String name, BigDecimal price, Integer categoryId, MultipartFile file) {
        validateProductInputs(name, price);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục sản phẩm"));
        product.setName(name.trim());
        product.setPrice(price);
        product.setCategory(category);
        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            product.setImageUrl(fileName);
        }
        return productRepository.save(product);
    }

    public void deleteProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        product.setIsAvailable(false);
        productRepository.save(product);
    }

    private void validateProductInputs(String name, BigDecimal price) {
        if (name == null || name.trim().isEmpty()) {
            throw new BusinessException("Tên sản phẩm không được để trống");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Giá bán sản phẩm phải lớn hơn 0");
        }
    }
}
